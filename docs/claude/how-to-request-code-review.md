# Claude Code로 효과적인 코드 리뷰 받기

> 헥사고날 아키텍처 기반 NestJS 프로젝트에서 Claude Code를 활용한 실전 코드 리뷰 가이드

## 🎯 코드 리뷰 전략

### 1. 리뷰 요청 단계별 접근

#### 📝 기본 리뷰 요청
```
이 UserService 코드를 헥사고날 아키텍처 원칙에 따라 리뷰해주세요.
특히 다음 항목들을 중점적으로 검토해주세요:
- 의존성 방향 준수 여부
- 도메인 로직의 순수성
- 포트와 어댑터 분리가 적절한지
- 테스트 가능성
```

#### 🎯 구체적 관점별 리뷰
```
이 CreateUserUseCase를 다음 관점에서 리뷰해주세요:
1. **비즈니스 로직**: 도메인 규칙이 올바르게 구현되었는지
2. **에러 처리**: 예외 상황 처리가 적절한지  
3. **성능**: 불필요한 쿼리나 비효율적인 로직이 있는지
4. **보안**: 입력 검증과 권한 체크가 충분한지
```

## 📚 실전 코드 리뷰 사례

### 사례 1: UseCase 리뷰

#### 🔍 리뷰 대상 코드
```typescript
// src/application/user/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService, // 🚨 잘못된 의존성
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // 🚨 검증 로직이 유스케이스에 있음
    if (!dto.email || !dto.email.includes('@')) {
      throw new Error('잘못된 이메일 형식');
    }

    // 🚨 도메인 객체를 사용하지 않음
    const user = {
      id: uuid(),
      email: dto.email,
      name: dto.name,
      createdAt: new Date(),
    };

    await this.userRepository.save(user);
    
    // 🚨 직접 외부 서비스 호출
    await this.emailService.sendWelcomeEmail(user.email);

    return { id: user.id, email: user.email, name: user.name };
  }
}
```

#### 💬 Claude 리뷰 요청
```
위 CreateUserUseCase 코드를 헥사고날 아키텍처 관점에서 리뷰해주세요.
문제점을 지적하고 개선된 코드를 제시해주세요.
```

#### ✨ Claude의 리뷰 응답 예시
```markdown
## 🔍 코드 리뷰 결과

### ❌ 발견된 문제점

1. **의존성 방향 위반**
   - `EmailService`를 직접 의존: Infrastructure 계층에 의존
   - 해결책: `NotificationPort` 인터페이스 사용

2. **도메인 로직 누락**
   - 도메인 엔티티 사용하지 않음
   - 비즈니스 검증이 유스케이스에 있음

3. **검증 로직 위치 부적절**
   - DTO 검증은 Infrastructure 계층에서 처리
   - 도메인 검증은 Domain 계층에서 처리

### ✅ 개선된 코드

```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationPort: NotificationPort, // ✅ 포트 사용
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = new Email(dto.email); // ✅ 값 객체 사용
    
    // ✅ 중복 검사
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DomainException('이미 존재하는 이메일입니다.');
    }

    // ✅ 도메인 엔티티 생성
    const user = User.create(
      UserId.generate(),
      email,
      new UserName(dto.name),
      UserRole.USER
    );

    await this.userRepository.save(user);
    await this.notificationPort.sendWelcomeEmail(user.email.value);

    return UserResponseDto.from(user);
  }
}
```

### 📊 개선 효과
- **테스트 용이성**: 포트를 통해 쉽게 Mock 주입
- **도메인 보호**: 비즈니스 로직이 도메인에 집중
- **의존성 역전**: 외부 의존성 제거
```

### 사례 2: Repository 구현체 리뷰

#### 🔍 리뷰 대상 코드
```typescript
// src/infrastructure/database/repositories/typeorm-user.repository.ts
@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> { // 🚨 타입 문제
    const result = await this.ormRepository.findOne({
      where: { email }
    });
    
    if (!result) return null;
    
    // 🚨 매핑 로직 누락
    return result as any as User;
  }

  async save(user: User): Promise<void> {
    // 🚨 도메인 -> ORM 변환 로직 없음
    await this.ormRepository.save(user as any);
  }
}
```

#### 💬 Claude 리뷰 요청
```
이 Repository 구현체를 리뷰해주세요. 
헥사고날 아키텍처에서 Repository 어댑터의 역할과 
도메인-ORM 간 매핑이 올바른지 확인해주세요.
```

#### ✨ Claude의 개선 제안
```typescript
@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly userMapper: UserMapper, // ✅ 매퍼 주입
  ) {
    super();
  }

  async findByEmail(email: Email): Promise<User | null> { // ✅ 값 객체 타입
    const ormEntity = await this.ormRepository.findOne({
      where: { email: email.value } // ✅ 값 객체 속성 사용
    });
    
    return ormEntity ? this.userMapper.toDomain(ormEntity) : null; // ✅ 매핑
  }

  async save(user: User): Promise<void> {
    const ormEntity = this.userMapper.toOrmEntity(user); // ✅ 도메인 -> ORM
    await this.ormRepository.save(ormEntity);
  }
}
```

### 사례 3: Controller 리뷰

#### 🔍 리뷰 대상 코드
```typescript
@Controller('users')
export class UserController {
  constructor(
    private readonly userRepository: UserRepository, // 🚨 잘못된 의존성
  ) {}

  @Post()
  async createUser(@Body() dto: any) { // 🚨 타입 안전성 없음
    const user = new User(
      uuid(),
      dto.email,
      dto.name,
      'USER',
      new Date(),
    );
    
    await this.userRepository.save(user);
    return user; // 🚨 도메인 객체 직접 노출
  }
}
```

#### 💬 리뷰 요청과 개선안

**요청:**
```
이 Controller를 헥사고날 아키텍처 원칙에 맞게 개선해주세요.
Web Adapter의 역할과 책임을 명확히 해주세요.
```

**개선된 코드:**
```typescript
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase, // ✅ 유스케이스 의존
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    try {
      const result = await this.createUserUseCase.execute(dto);
      return {
        success: true,
        data: result,
        message: '사용자가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: error.message
        }
      });
    }
  }
}
```

## 🛠️ 고급 리뷰 기법

### 아키텍처 컴플라이언스 체크

```
다음 체크리스트로 전체 프로젝트의 헥사고날 아키텍처 준수도를 검토해주세요:

1. **의존성 방향 검증**
   - Domain 계층이 외부 라이브러리를 import하지 않는지
   - Infrastructure가 Domain을 참조하는지
   - Application이 Infrastructure를 직접 참조하지 않는지

2. **포트와 어댑터 분리**
   - 모든 외부 의존성이 포트로 추상화되었는지
   - 어댑터가 포트를 올바르게 구현했는지

3. **도메인 모델 순수성**
   - 비즈니스 로직이 도메인에 집중되어 있는지
   - 값 객체와 엔티티가 적절히 사용되었는지

전체 src/ 폴더를 분석해서 위반 사항을 찾아주세요.
```

### 성능 최적화 리뷰

```
이 Repository 구현체의 성능을 분석해주세요:

1. **쿼리 최적화**: N+1 문제가 있는지 확인
2. **인덱스 활용**: 검색 쿼리가 인덱스를 활용하는지
3. **트랜잭션 범위**: 트랜잭션이 적절한 범위에서 관리되는지
4. **캐싱 기회**: 캐시 가능한 부분이 있는지

구체적인 개선 방안을 코드와 함께 제시해주세요.
```

### 보안 리뷰

```
사용자 인증/인가 관련 코드를 보안 관점에서 리뷰해주세요:

1. **입력 검증**: 모든 사용자 입력이 적절히 검증되는지
2. **권한 체크**: 리소스 접근 권한이 올바르게 확인되는지  
3. **데이터 노출**: 민감한 정보가 응답에 포함되지 않는지
4. **토큰 관리**: JWT 토큰이 안전하게 처리되는지

OWASP Top 10 기준으로 취약점을 찾아주세요.
```

## 📋 코드 리뷰 체크리스트

### 도메인 레이어 체크리스트
- [ ] 외부 라이브러리 import 없음
- [ ] 비즈니스 로직이 도메인에 집중
- [ ] 값 객체로 primitive 타입 감싸기
- [ ] 엔티티의 불변성 보장
- [ ] 도메인 이벤트 적절히 사용

### 애플리케이션 레이어 체크리스트
- [ ] 유스케이스가 단일 책임 준수
- [ ] 포트를 통한 외부 의존성 추상화
- [ ] DTO를 통한 입출력 관리
- [ ] 트랜잭션 경계 명확히 정의
- [ ] 적절한 예외 처리

### 인프라스트럭처 레이어 체크리스트
- [ ] 어댑터가 포트 인터페이스 구현
- [ ] 도메인-ORM 매핑 로직 분리
- [ ] 외부 API 호출 추상화
- [ ] 설정과 환경별 분리
- [ ] 적절한 로깅 및 모니터링

## 💡 리뷰 요청 팁

### 🎯 효과적인 리뷰 요청 방법

1. **구체적인 관점 명시**
   ```
   "이 코드를 리뷰해주세요" (X)
   "헥사고날 아키텍처 의존성 방향 관점에서 리뷰해주세요" (O)
   ```

2. **컨텍스트 제공**
   ```
   "이 유스케이스는 관리자만 실행할 수 있고, 
   실행 시 이메일 알림을 보내야 합니다. 
   이런 요구사항이 올바르게 구현되었는지 확인해주세요."
   ```

3. **우선순위 설정**
   ```
   "다음 순서로 검토해주세요:
   1순위: 보안 이슈
   2순위: 성능 문제  
   3순위: 코드 품질"
   ```

### 🚫 피해야 할 리뷰 요청

- 너무 큰 범위: "전체 프로젝트 리뷰해주세요"
- 모호한 요청: "이상한 부분 찾아주세요"
- 맥락 없는 코드: 파일 하나만 던지기

---

> **핵심**: Claude Code를 통한 코드 리뷰는 **구체적이고 맥락이 있는 요청**일 때 가장 효과적입니다. 헥사고날 아키텍처의 원칙을 명시하고, 검토하고 싶은 관점을 명확히 하세요!