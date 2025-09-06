# Claude Code로 체계적인 테스트 코드 작성하기

> 헥사고날 아키텍처 기반 NestJS 프로젝트에서 Claude Code를 활용한 효과적인 테스트 전략 및 구현 가이드

## 🎯 헥사고날 아키텍처 테스트 전략

### 테스트 피라미드 적용
```
     /\
    /  \     E2E Tests (Few)
   /____\    Integration Tests (Some)  
  /______\   Unit Tests (Many)
```

- **Unit Tests**: Domain/Application 레이어 중심 (80%)
- **Integration Tests**: Infrastructure 어댑터 (15%)  
- **E2E Tests**: 전체 시나리오 (5%)

## 📊 레이어별 테스트 전략

### 1️⃣ Domain Layer 테스트 (순수 단위 테스트)

#### 🎯 특징
- 외부 의존성 없음
- 빠른 실행 속도  
- 비즈니스 로직 검증에 집중
- Mock/Stub 불필요

#### 💬 Claude 테스트 작성 요청
```
다음 User 도메인 엔티티에 대한 완전한 테스트 스위트를 작성해주세요:

1. **정상 케이스**:
   - 사용자 생성 성공
   - 프로필 업데이트 성공
   - 역할 변경 성공

2. **예외 케이스**:
   - 잘못된 이메일 형식
   - 권한 없는 역할 변경
   - 빈 이름으로 업데이트 시도

3. **경계값 테스트**:
   - 최소/최대 길이 이름
   - 특수문자 포함 케이스

4. **도메인 이벤트 테스트**:
   - 이벤트 발생 여부
   - 이벤트 데이터 정확성

AAA 패턴(Arrange-Act-Assert)을 사용하고, 
테스트명은 한국어로 명확하게 작성해주세요.
```

#### ✨ Claude 생성 테스트 코드 예시
```typescript
// src/domain/user/entities/user.entity.spec.ts
describe('User 도메인 엔티티', () => {
  describe('create', () => {
    it('유효한 정보로 사용자를 생성할 수 있다', () => {
      // Arrange
      const email = new Email('test@example.com');
      const name = new UserName('홍길동');

      // Act
      const user = User.create(email, name);

      // Assert
      expect(user.email).toEqual(email);
      expect(user.name).toEqual(name);
      expect(user.role).toEqual(UserRole.USER);
      expect(user.id).toBeDefined();
    });

    it('잘못된 이메일로 사용자 생성시 예외가 발생한다', () => {
      // Arrange & Act & Assert
      expect(() => new Email('invalid-email')).toThrow('유효하지 않은 이메일 형식입니다.');
    });
  });

  describe('updateProfile', () => {
    it('유효한 정보로 프로필을 업데이트할 수 있다', () => {
      // Arrange
      const user = User.create(
        new Email('old@example.com'),
        new UserName('구이름')
      );
      const newEmail = new Email('new@example.com');
      const newName = new UserName('새이름');

      // Act
      user.updateProfile(newName, newEmail);

      // Assert
      expect(user.name).toEqual(newName);
      expect(user.email).toEqual(newEmail);
    });

    it('프로필 업데이트시 도메인 이벤트가 발생한다', () => {
      // Arrange
      const user = User.create(
        new Email('old@example.com'),
        new UserName('사용자')
      );
      const newEmail = new Email('new@example.com');
      const newName = new UserName('새이름');

      // Act
      user.updateProfile(newName, newEmail);

      // Assert
      const events = user.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserProfileUpdatedEvent);
      expect((events[0] as UserProfileUpdatedEvent).userId).toBe(user.id.value);
      expect((events[0] as UserProfileUpdatedEvent).newEmail).toBe(newEmail.value);
    });

    it('이름이 2자 미만일 때 예외가 발생한다', () => {
      // Arrange
      const user = User.create(
        new Email('test@example.com'),
        new UserName('홍길동')
      );

      // Act & Assert
      expect(() => new UserName('김')).toThrow('이름은 2자 이상이어야 합니다.');
    });
  });

  describe('changeRole', () => {
    it('관리자가 일반 사용자의 역할을 변경할 수 있다', () => {
      // Arrange
      const user = User.create(
        new Email('user@example.com'),
        new UserName('사용자')
      );
      const adminRole = UserRole.ADMIN;
      const moderatorRole = UserRole.MODERATOR;

      // Act
      user.changeRole(moderatorRole, adminRole);

      // Assert
      expect(user.role).toEqual(moderatorRole);
    });

    it('일반 사용자는 다른 사용자의 역할을 변경할 수 없다', () => {
      // Arrange
      const user = User.create(
        new Email('user@example.com'),
        new UserName('사용자')
      );
      const userRole = UserRole.USER;
      const adminRole = UserRole.ADMIN;

      // Act & Assert
      expect(() => user.changeRole(adminRole, userRole))
        .toThrow('권한이 없습니다.');
    });
  });

  describe('도메인 이벤트', () => {
    it('새로 생성된 사용자는 도메인 이벤트가 없다', () => {
      // Arrange & Act
      const user = User.create(
        new Email('test@example.com'),
        new UserName('사용자')
      );

      // Assert
      expect(user.domainEvents).toHaveLength(0);
    });

    it('도메인 이벤트를 클리어할 수 있다', () => {
      // Arrange
      const user = User.create(
        new Email('old@example.com'),
        new UserName('사용자')
      );
      user.updateProfile(
        new UserName('새이름'),
        new Email('new@example.com')
      );

      // Act
      user.clearDomainEvents();

      // Assert
      expect(user.domainEvents).toHaveLength(0);
    });
  });
});

// src/domain/user/value-objects/email.vo.spec.ts
describe('Email 값 객체', () => {
  describe('생성', () => {
    const validEmails = [
      'test@example.com',
      'user.name+tag@domain.co.kr',
      'admin@test-domain.org'
    ];

    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com',
      ''
    ];

    validEmails.forEach(email => {
      it(`유효한 이메일 "${email}"으로 생성할 수 있다`, () => {
        // Act & Assert
        expect(() => new Email(email)).not.toThrow();
        expect(new Email(email).value).toBe(email);
      });
    });

    invalidEmails.forEach(email => {
      it(`잘못된 이메일 "${email}"로 생성시 예외가 발생한다`, () => {
        // Act & Assert
        expect(() => new Email(email)).toThrow('유효하지 않은 이메일 형식입니다.');
      });
    });
  });

  describe('동등성 비교', () => {
    it('같은 이메일 값은 동등하다', () => {
      // Arrange
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });

    it('다른 이메일 값은 동등하지 않다', () => {
      // Arrange
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');

      // Act & Assert
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
```

### 2️⃣ Application Layer 테스트 (UseCase 테스트)

#### 💬 Claude 테스트 작성 요청
```
CreateUserUseCase에 대한 포괄적인 테스트를 작성해주세요:

1. **Mocking 전략**:
   - Repository 포트 Mock 처리
   - External Service 포트 Mock 처리
   - 적절한 Jest Mock 사용

2. **테스트 시나리오**:
   - 성공적인 사용자 생성
   - 이메일 중복시 예외 처리
   - 외부 서비스 호출 실패 처리
   - 도메인 검증 실패 처리

3. **Interaction Testing**:
   - Repository save 호출 검증
   - Notification 발송 검증
   - 호출 순서 및 매개변수 검증

4. **Error Handling**:
   - 각종 예외 상황별 적절한 처리
   - 부분 실패시 롤백 처리

Mock 객체 생성부터 테스트 실행까지 완전한 코드를 작성해주세요.
```

#### ✨ Application Layer 테스트 코드
```typescript
// src/application/user/use-cases/create-user.use-case.spec.ts
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockNotificationPort: jest.Mocked<NotificationPort>;
  let mockDomainEventPublisher: jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    // Arrange - Mock 객체 생성
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepository>;

    mockNotificationPort = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as jest.Mocked<NotificationPort>;

    mockDomainEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as jest.Mocked<DomainEventPublisher>;

    useCase = new CreateUserUseCase(
      mockUserRepository,
      mockNotificationPort,
      mockDomainEventPublisher,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new CreateUserCommand(
      'test@example.com',
      '홍길동'
    );

    it('유효한 명령으로 사용자를 성공적으로 생성한다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null); // 중복 없음
      mockUserRepository.save.mockResolvedValue(undefined);
      mockNotificationPort.sendWelcomeEmail.mockResolvedValue(undefined);
      mockDomainEventPublisher.publishAll.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('홍길동');
      
      // Interaction 검증
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
      
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.objectContaining({ value: 'test@example.com' }),
          name: expect.objectContaining({ value: '홍길동' })
        })
      );
      
      expect(mockNotificationPort.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(mockNotificationPort.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('이미 존재하는 이메일로 생성시 ConflictException이 발생한다', async () => {
      // Arrange
      const existingUser = User.create(
        new Email('test@example.com'),
        new UserName('기존사용자')
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(useCase.execute(validCommand))
        .rejects
        .toThrow(ConflictException);
      
      // 부작용이 없어야 함
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockNotificationPort.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('잘못된 이메일 형식으로 생성시 DomainException이 발생한다', async () => {
      // Arrange
      const invalidCommand = new CreateUserCommand(
        'invalid-email',
        '홍길동'
      );

      // Act & Assert
      await expect(useCase.execute(invalidCommand))
        .rejects
        .toThrow('유효하지 않은 이메일 형식입니다.');
      
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('Repository 저장 실패시 예외가 전파된다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('DB 연결 오류'));

      // Act & Assert
      await expect(useCase.execute(validCommand))
        .rejects
        .toThrow('DB 연결 오류');
      
      // 알림은 발송되지 않아야 함
      expect(mockNotificationPort.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('알림 발송 실패시에도 사용자는 생성된다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockNotificationPort.sendWelcomeEmail.mockRejectedValue(
        new Error('이메일 서버 오류')
      );

      // Act & Assert
      // 알림 실패로 인해 전체가 실패하지 않아야 함 (비즈니스 요구사항에 따라)
      const result = await useCase.execute(validCommand);
      
      expect(result).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      
      // 하지만 알림 발송은 시도되어야 함
      expect(mockNotificationPort.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    describe('도메인 이벤트 처리', () => {
      it('사용자 생성 후 도메인 이벤트를 발행한다', async () => {
        // Arrange
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.save.mockResolvedValue(undefined);
        mockNotificationPort.sendWelcomeEmail.mockResolvedValue(undefined);
        mockDomainEventPublisher.publishAll.mockResolvedValue(undefined);

        // Act
        await useCase.execute(validCommand);

        // Assert
        expect(mockDomainEventPublisher.publishAll).toHaveBeenCalledTimes(1);
        // 이벤트 내용까지 상세히 검증하고 싶다면:
        const publishedEvents = mockDomainEventPublisher.publishAll.mock.calls[0][0];
        expect(publishedEvents).toHaveLength(0); // 생성시에는 이벤트 없음
      });
    });
  });

  describe('성능 테스트', () => {
    it('대량의 사용자 생성 요청을 처리할 수 있다', async () => {
      // Arrange
      const commands = Array.from({ length: 100 }, (_, i) => 
        new CreateUserCommand(`user${i}@example.com`, `사용자${i}`)
      );
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockNotificationPort.sendWelcomeEmail.mockResolvedValue(undefined);

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        commands.map(command => useCase.execute(command))
      );
      const endTime = Date.now();

      // Assert
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // 5초 이내
      expect(mockUserRepository.save).toHaveBeenCalledTimes(100);
    });
  });
});
```

### 3️⃣ Infrastructure Layer 테스트 (통합 테스트)

#### 💬 데이터베이스 통합 테스트 요청
```
TypeOrmUserRepository에 대한 실제 데이터베이스를 사용한 통합 테스트를 작성해주세요:

1. **테스트 환경 설정**:
   - In-memory SQLite 사용
   - 테스트용 TypeORM 설정
   - 트랜잭션 롤백으로 격리

2. **Repository 메서드 테스트**:
   - save/findById/findByEmail 동작 검증
   - 도메인 객체 ↔ ORM 엔티티 매핑 검증
   - 데이터베이스 제약조건 테스트

3. **실패 시나리오**:
   - 중복 키 에러 처리
   - 존재하지 않는 ID 조회
   - 잘못된 쿼리 매개변수

NestJS Testing Module과 함께 사용할 수 있도록 작성해주세요.
```

#### ✨ Infrastructure Layer 통합 테스트
```typescript
// src/infrastructure/database/repositories/typeorm-user.repository.integration.spec.ts
describe('TypeOrmUserRepository 통합 테스트', () => {
  let app: TestingModule;
  let repository: TypeOrmUserRepository;
  let ormRepository: Repository<UserOrmEntity>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // 테스트용 모듈 설정
    app = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserOrmEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([UserOrmEntity]),
      ],
      providers: [
        TypeOrmUserRepository,
        UserMapper,
      ],
    }).compile();

    repository = app.get<TypeOrmUserRepository>(TypeOrmUserRepository);
    ormRepository = app.get<Repository<UserOrmEntity>>(getRepositoryToken(UserOrmEntity));
    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 테이블 정리
    await ormRepository.clear();
  });

  describe('save', () => {
    it('새로운 사용자를 저장할 수 있다', async () => {
      // Arrange
      const user = User.create(
        new Email('test@example.com'),
        new UserName('홍길동')
      );

      // Act
      await repository.save(user);

      // Assert
      const savedEntity = await ormRepository.findOne({
        where: { email: 'test@example.com' }
      });
      
      expect(savedEntity).toBeDefined();
      expect(savedEntity!.email).toBe('test@example.com');
      expect(savedEntity!.name).toBe('홍길동');
      expect(savedEntity!.role).toBe('USER');
    });

    it('기존 사용자를 업데이트할 수 있다', async () => {
      // Arrange - 기존 사용자 생성
      const user = User.reconstitute(
        new UserId('existing-user-id'),
        new Email('old@example.com'),
        new UserName('구이름'),
        new Date(),
      );
      await repository.save(user);

      // 프로필 업데이트
      user.updateProfile(
        new UserName('새이름'),
        new Email('new@example.com')
      );

      // Act
      await repository.save(user);

      // Assert
      const updatedEntity = await ormRepository.findOne({
        where: { id: 'existing-user-id' }
      });
      
      expect(updatedEntity!.name).toBe('새이름');
      expect(updatedEntity!.email).toBe('new@example.com');
    });

    it('이메일 중복시 데이터베이스 제약조건 오류가 발생한다', async () => {
      // Arrange
      const user1 = User.create(
        new Email('duplicate@example.com'),
        new UserName('사용자1')
      );
      const user2 = User.create(
        new Email('duplicate@example.com'),
        new UserName('사용자2')
      );

      // Act
      await repository.save(user1);

      // Assert
      await expect(repository.save(user2))
        .rejects
        .toThrow(); // SQLite UNIQUE constraint 오류
    });
  });

  describe('findByEmail', () => {
    it('존재하는 이메일로 사용자를 찾을 수 있다', async () => {
      // Arrange
      const email = new Email('find@example.com');
      const originalUser = User.create(email, new UserName('찾을사용자'));
      await repository.save(originalUser);

      // Act
      const foundUser = await repository.findByEmail(email);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser!.email.value).toBe('find@example.com');
      expect(foundUser!.name.value).toBe('찾을사용자');
      expect(foundUser!.role.value).toBe('USER');
    });

    it('존재하지 않는 이메일로 조회시 null을 반환한다', async () => {
      // Arrange
      const email = new Email('nonexistent@example.com');

      // Act
      const foundUser = await repository.findByEmail(email);

      // Assert
      expect(foundUser).toBeNull();
    });

    it('대소문자 구분없이 이메일을 찾을 수 있다', async () => {
      // Arrange
      const user = User.create(
        new Email('CaseSensitive@Example.COM'),
        new UserName('대소문자테스트')
      );
      await repository.save(user);

      // Act
      const foundUser = await repository.findByEmail(
        new Email('casesensitive@example.com')
      );

      // Assert (이메일은 일반적으로 대소문자 구분하지 않음)
      expect(foundUser).toBeDefined();
    });
  });

  describe('findById', () => {
    it('존재하는 ID로 사용자를 찾을 수 있다', async () => {
      // Arrange
      const userId = UserId.generate();
      const user = User.reconstitute(
        userId,
        new Email('findbyid@example.com'),
        new UserName('ID로찾기'),
        new Date(),
      );
      await repository.save(user);

      // Act
      const foundUser = await repository.findById(userId);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser!.id.value).toBe(userId.value);
      expect(foundUser!.email.value).toBe('findbyid@example.com');
    });

    it('존재하지 않는 ID로 조회시 null을 반환한다', async () => {
      // Arrange
      const nonExistentId = new UserId('non-existent-id');

      // Act
      const foundUser = await repository.findById(nonExistentId);

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('도메인 ↔ ORM 매핑', () => {
    it('도메인 객체가 올바르게 ORM 엔티티로 변환된다', async () => {
      // Arrange
      const user = User.create(
        new Email('mapping@example.com'),
        new UserName('매핑테스트')
      );

      // Act
      await repository.save(user);

      // Assert - 직접 ORM으로 조회하여 매핑 검증
      const ormEntity = await ormRepository.findOne({
        where: { email: 'mapping@example.com' }
      });
      
      expect(ormEntity!.email).toBe(user.email.value);
      expect(ormEntity!.name).toBe(user.name.value);
      expect(ormEntity!.role).toBe(user.role.value);
      expect(ormEntity!.created_at).toBeInstanceOf(Date);
    });

    it('ORM 엔티티가 올바르게 도메인 객체로 변환된다', async () => {
      // Arrange - 직접 ORM으로 데이터 생성
      const ormEntity = new UserOrmEntity();
      ormEntity.id = 'orm-test-id';
      ormEntity.email = 'orm@example.com';
      ormEntity.name = 'ORM테스트';
      ormEntity.role = 'ADMIN';
      ormEntity.created_at = new Date();
      ormEntity.updated_at = new Date();
      
      await ormRepository.save(ormEntity);

      // Act
      const domainUser = await repository.findById(new UserId('orm-test-id'));

      // Assert
      expect(domainUser).toBeDefined();
      expect(domainUser!.id.value).toBe('orm-test-id');
      expect(domainUser!.email.value).toBe('orm@example.com');
      expect(domainUser!.name.value).toBe('ORM테스트');
      expect(domainUser!.role.value).toBe('ADMIN');
    });
  });

  describe('트랜잭션 처리', () => {
    it('트랜잭션 롤백시 변경사항이 취소된다', async () => {
      // Arrange
      const user = User.create(
        new Email('transaction@example.com'),
        new UserName('트랜잭션테스트')
      );

      // Act - 트랜잭션 내에서 저장 후 롤백
      await dataSource.transaction(async (manager) => {
        const transactionalRepo = manager.getRepository(UserOrmEntity);
        const userEntity = UserMapper.toOrmEntity(user);
        await transactionalRepo.save(userEntity);
        
        // 강제로 롤백
        throw new Error('트랜잭션 롤백 테스트');
      }).catch(() => {
        // 예상된 에러이므로 무시
      });

      // Assert - 롤백으로 인해 사용자가 저장되지 않았어야 함
      const foundUser = await repository.findByEmail(user.email);
      expect(foundUser).toBeNull();
    });
  });

  describe('성능 테스트', () => {
    it('대량 데이터 저장/조회 성능을 확인한다', async () => {
      // Arrange
      const users = Array.from({ length: 100 }, (_, i) => 
        User.create(
          new Email(`perf${i}@example.com`),
          new UserName(`성능테스트${i}`)
        )
      );

      // Act - 저장 성능 측정
      const saveStartTime = Date.now();
      await Promise.all(users.map(user => repository.save(user)));
      const saveEndTime = Date.now();

      // 조회 성능 측정
      const findStartTime = Date.now();
      const foundUsers = await Promise.all(
        users.map(user => repository.findByEmail(user.email))
      );
      const findEndTime = Date.now();

      // Assert
      expect(foundUsers.filter(u => u !== null)).toHaveLength(100);
      expect(saveEndTime - saveStartTime).toBeLessThan(5000); // 5초 이내
      expect(findEndTime - findStartTime).toBeLessThan(2000); // 2초 이내
    });
  });
});
```

### 4️⃣ E2E 테스트 (전체 시나리오 테스트)

#### 💬 E2E 테스트 요청
```
사용자 관리 API에 대한 전체 E2E 테스트 시나리오를 작성해주세요:

1. **사용자 생명주기 테스트**:
   - 회원가입 → 로그인 → 프로필 조회 → 프로필 수정 → 탈퇴

2. **인증/인가 테스트**:
   - JWT 토큰 발급 및 검증
   - 권한별 접근 제어 확인
   - 토큰 만료 처리

3. **에러 시나리오**:
   - 잘못된 요청 데이터
   - 권한 없는 접근
   - 존재하지 않는 리소스

4. **API 계약 테스트**:
   - Request/Response 스키마 검증
   - HTTP 상태 코드 확인
   - 헤더 정보 검증

실제 HTTP 요청을 보내는 통합 테스트로 작성해주세요.
```

#### ✨ E2E 테스트 코드
```typescript
// test/user.e2e-spec.ts
describe('User API E2E 테스트', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(UserRepository)
    .useClass(InMemoryUserRepository) // 테스트용 Repository
    .compile();

    app = moduleFixture.createNestApplication();
    
    // 실제 애플리케이션과 같은 설정 적용
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('사용자 생명주기 시나리오', () => {
    let accessToken: string;
    let userId: string;

    it('1단계: 새 사용자를 생성할 수 있다 (POST /users)', async () => {
      // Arrange
      const createUserDto = {
        email: 'e2e@example.com',
        name: 'E2E테스트사용자',
        password: 'SecurePassword123!'
      };

      // Act
      const response = await request(httpServer)
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: {
          id: expect.any(String),
          email: 'e2e@example.com',
          name: 'E2E테스트사용자',
          role: 'USER',
          createdAt: expect.any(String)
        },
        message: '사용자가 성공적으로 생성되었습니다.'
      });

      userId = response.body.data.id;
    });

    it('2단계: 중복 이메일로 사용자 생성시 409 오류가 발생한다', async () => {
      // Arrange
      const duplicateUserDto = {
        email: 'e2e@example.com', // 이미 존재하는 이메일
        name: '중복테스트',
        password: 'AnotherPassword123!'
      };

      // Act & Assert
      const response = await request(httpServer)
        .post('/users')
        .send(duplicateUserDto)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'CONFLICT',
          message: '이미 존재하는 이메일입니다.'
        },
        timestamp: expect.any(String)
      });
    });

    it('3단계: 생성된 사용자로 로그인할 수 있다 (POST /auth/login)', async () => {
      // Arrange
      const loginDto = {
        email: 'e2e@example.com',
        password: 'SecurePassword123!'
      };

      // Act
      const response = await request(httpServer)
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number),
          user: {
            id: userId,
            email: 'e2e@example.com',
            name: 'E2E테스트사용자',
            role: 'USER'
          }
        }
      });

      accessToken = response.body.data.accessToken;
    });

    it('4단계: JWT 토큰으로 사용자 정보를 조회할 수 있다 (GET /users/me)', async () => {
      // Act
      const response = await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: {
          id: userId,
          email: 'e2e@example.com',
          name: 'E2E테스트사용자',
          role: 'USER',
          createdAt: expect.any(String)
        }
      });
    });

    it('5단계: 프로필을 수정할 수 있다 (PATCH /users/me)', async () => {
      // Arrange
      const updateDto = {
        name: '수정된이름',
        email: 'updated@example.com'
      };

      // Act
      const response = await request(httpServer)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: {
          id: userId,
          email: 'updated@example.com',
          name: '수정된이름',
          role: 'USER',
          updatedAt: expect.any(String)
        },
        message: '프로필이 성공적으로 수정되었습니다.'
      });
    });

    it('6단계: 수정된 정보가 반영되었는지 확인한다 (GET /users/me)', async () => {
      // Act
      const response = await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.name).toBe('수정된이름');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('7단계: 계정을 삭제할 수 있다 (DELETE /users/me)', async () => {
      // Act
      const response = await request(httpServer)
        .delete('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.'
      });
    });

    it('8단계: 삭제된 계정으로는 접근할 수 없다', async () => {
      // Act & Assert
      await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401); // 또는 404
    });
  });

  describe('인증/인가 시나리오', () => {
    it('토큰 없이 보호된 엔드포인트 접근시 401 오류가 발생한다', async () => {
      // Act & Assert
      await request(httpServer)
        .get('/users/me')
        .expect(401);
    });

    it('잘못된 토큰으로 접근시 401 오류가 발생한다', async () => {
      // Act & Assert
      await request(httpServer)
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('만료된 토큰으로 접근시 401 오류가 발생한다', async () => {
      // Arrange - 만료된 토큰 생성 (테스트용)
      const expiredToken = 'expired.jwt.token';

      // Act & Assert
      await request(httpServer)
        .get('/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('일반 사용자가 관리자 전용 엔드포인트 접근시 403 오류가 발생한다', async () => {
      // Arrange - 일반 사용자 토큰 생성
      const userToken = await createUserAndGetToken('user@example.com', 'USER');

      // Act & Assert
      await request(httpServer)
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('데이터 검증 시나리오', () => {
    it('잘못된 이메일 형식으로 사용자 생성시 400 오류가 발생한다', async () => {
      // Arrange
      const invalidDto = {
        email: 'invalid-email', // 잘못된 형식
        name: '테스트',
        password: 'Password123!'
      };

      // Act & Assert
      const response = await request(httpServer)
        .post('/users')
        .send(invalidDto)
        .expect(400);

      expect(response.body.error.message).toContain('유효한 이메일');
    });

    it('짧은 비밀번호로 사용자 생성시 400 오류가 발생한다', async () => {
      // Arrange
      const invalidDto = {
        email: 'test@example.com',
        name: '테스트',
        password: '123' // 너무 짧음
      };

      // Act & Assert
      const response = await request(httpServer)
        .post('/users')
        .send(invalidDto)
        .expect(400);

      expect(response.body.error.message).toContain('비밀번호는 8자 이상');
    });

    it('빈 이름으로 사용자 생성시 400 오류가 발생한다', async () => {
      // Arrange
      const invalidDto = {
        email: 'test@example.com',
        name: '', // 빈 이름
        password: 'Password123!'
      };

      // Act & Assert
      await request(httpServer)
        .post('/users')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('성능 시나리오', () => {
    it('동시에 여러 사용자를 생성할 수 있다', async () => {
      // Arrange
      const createRequests = Array.from({ length: 10 }, (_, i) => 
        request(httpServer)
          .post('/users')
          .send({
            email: `concurrent${i}@example.com`,
            name: `동시생성${i}`,
            password: 'Password123!'
          })
      );

      // Act
      const startTime = Date.now();
      const responses = await Promise.all(createRequests);
      const endTime = Date.now();

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      expect(endTime - startTime).toBeLessThan(3000); // 3초 이내
    });

    it('사용자 목록 조회 성능이 적절하다 (GET /users)', async () => {
      // Arrange - 관리자 토큰
      const adminToken = await createUserAndGetToken('admin@example.com', 'ADMIN');

      // Act
      const startTime = Date.now();
      const response = await request(httpServer)
        .get('/users?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();

      // Assert
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });
  });

  // 헬퍼 함수
  async function createUserAndGetToken(email: string, role: string = 'USER'): Promise<string> {
    // 사용자 생성
    await request(httpServer)
      .post('/users')
      .send({
        email,
        name: '테스트사용자',
        password: 'Password123!',
        role
      });

    // 로그인하여 토큰 획득
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        email,
        password: 'Password123!'
      });

    return loginResponse.body.data.accessToken;
  }
});
```

## 📊 테스트 실행 및 관리

### 테스트 실행 스크립트
```bash
# 모든 테스트 실행
npm run test

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행  
npm run test:integration

# E2E 테스트만 실행
npm run test:e2e

# 커버리지 포함 실행
npm run test:cov

# 특정 파일만 실행
npm run test user.entity.spec.ts

# watch 모드로 실행
npm run test:watch
```

### 테스트 설정 요청
```
Jest 테스트 설정을 최적화해주세요:

1. **성능 최적화**:
   - 병렬 실행 설정
   - 테스트 파일별 타임아웃
   - Setup/Teardown 최적화

2. **리포팅**:
   - 커버리지 임계값 설정
   - HTML 리포트 생성
   - CI/CD용 JUnit XML

3. **환경 설정**:
   - 테스트 환경별 설정 분리
   - Mock 설정 자동화
   - 데이터베이스 초기화

완전한 jest.config.js 파일을 작성해주세요.
```

## 💡 테스트 작성 베스트 프랙티스

### ✅ 좋은 테스트 작성법
1. **명확한 테스트명**: "무엇을_언제_어떻게된다" 형식
2. **AAA 패턴**: Arrange-Act-Assert 구조 준수
3. **단일 관심사**: 하나의 테스트는 하나의 동작만 검증
4. **독립성**: 테스트 간 의존성 없음
5. **결정적**: 항상 같은 결과 반환

### 🚫 피해야 할 안티패턴
- **테스트로 테스트하기**: Mock의 동작을 테스트
- **구현 세부사항 테스트**: 내부 메서드 호출 검증
- **과도한 Mocking**: 실제 로직이 테스트되지 않음
- **거대한 테스트**: 여러 동작을 한 번에 테스트
- **매직 넘버**: 의미없는 상수값 사용

---

> **핵심**: 헥사고날 아키텍처에서 테스트는 **각 레이어의 책임에 맞게 전략을 달리**해야 합니다. Domain은 순수 단위 테스트, Application은 Mock을 활용한 단위 테스트, Infrastructure는 실제 통합 테스트로 접근하세요!