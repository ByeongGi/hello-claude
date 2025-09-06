# 📂 데이터베이스 시딩 가이드

테스트 및 개발용 시드 데이터를 관리하는 방법에 대한 가이드입니다.

## 🌱 시드 데이터 개요

### 포함된 테스트 계정들

| 이름 | 이메일 | 비밀번호 | 역할 | 상태 | 용도 |
|------|--------|----------|------|------|------|
| 관리자 | admin@example.com | admin123! | ADMIN | 활성 | 관리자 기능 테스트 |
| 홍길동 | hong@example.com | user123! | USER | 활성 | 일반 사용자 테스트 |
| 김영희 | kim@example.com | user123! | USER | 활성 | 일반 사용자 테스트 |
| 박민수 | park@example.com | user123! | USER | 비활성 | 비활성 계정 테스트 |
| 테스트 사용자1 | test1@example.com | test123! | USER | 활성 | 자동 테스트용 |
| 테스트 사용자2 | test2@example.com | test123! | USER | 활성 | 자동 테스트용 |
| 개발자 | dev@example.com | dev123! | ADMIN | 활성 | 개발자 테스트용 |

## 🚀 시드 명령어

### 1. **기본 시드 실행**
```bash
# 시드 데이터 생성 (기존 데이터가 없을 때만)
npm run seed

# 또는
npm run seed:run
```

### 2. **데이터 상태 확인**
```bash
# 현재 데이터베이스 상태 조회
npm run seed:status
```

### 3. **데이터 초기화**
```bash
# 모든 데이터 삭제
npm run seed:clear

# 데이터 삭제 후 다시 시드 실행
npm run seed:reset
```

## 🐳 Docker 환경에서 사용

### 1. **Docker 컨테이너 시작**
```bash
# PostgreSQL + Redis + pgAdmin 시작
npm run docker:up

# 로그 확인
npm run docker:logs

# 컨테이너 중단
npm run docker:down
```

### 2. **데이터베이스 접속 정보**

**PostgreSQL 직접 접속:**
- Host: localhost
- Port: 5432
- Database: nestjs_user_management
- Username: postgres
- Password: password

**pgAdmin 웹 인터페이스:**
- URL: http://localhost:5050
- Email: admin@admin.com
- Password: admin

### 3. **컨테이너 환경에서 시드 실행**
```bash
# Docker PostgreSQL이 실행 중일 때
npm run seed
```

## 🧪 테스트에서 시드 데이터 활용

### E2E 테스트 예시
```typescript
import { testCredentials } from '../src/infrastructure/database/seeds/user.seed';

describe('Authentication E2E', () => {
  it('should login with admin credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testCredentials.admin.email,
        password: testCredentials.admin.password,
      })
      .expect(200);
      
    expect(response.body).toHaveProperty('access_token');
  });
});
```

### 단위 테스트에서 활용
```typescript
import { userSeeds } from '../src/infrastructure/database/seeds/user.seed';

describe('UserService', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스에 시드 데이터 생성
    await userRepository.save(userSeeds);
  });
});
```

## 🔧 시드 데이터 커스터마이징

### 새로운 시드 데이터 추가
```typescript
// src/infrastructure/database/seeds/user.seed.ts
export const userSeeds: Partial<User>[] = [
  // 기존 데이터들...
  {
    name: '새 사용자',
    email: 'newuser@example.com',
    password: bcrypt.hashSync('newpass123!', 10),
    role: UserRole.USER,
    isActive: true,
  },
];
```

### 새로운 엔티티 시드 추가
1. **시드 데이터 파일 생성**: `src/infrastructure/database/seeds/새엔티티.seed.ts`
2. **SeedService에 메서드 추가**: `seed새엔티티()` 메서드 구현
3. **runAll() 메서드에 추가**: 새 시드 메서드 호출

## 🛡️ 보안 고려사항

### 운영 환경 주의사항
- **절대 운영 환경에서 시드 실행 금지**
- **시드 비밀번호는 개발/테스트용으로만 사용**
- **실제 이메일 주소 사용 금지**

### 환경별 분리
```typescript
// 개발 환경에서만 시드 실행
if (process.env.NODE_ENV !== 'production') {
  await seedService.runAll();
}
```

## 📊 시드 데이터 관리 모범 사례

### 1. **일관된 데이터 구조**
- 모든 시드 데이터는 동일한 패턴 사용
- 의미 있는 테스트 데이터 생성
- 다양한 시나리오 커버

### 2. **유지보수성**
- 시드 데이터 변경 시 문서 업데이트
- 테스트 케이스와 시드 데이터 동기화
- 버전 관리로 변경 이력 추적

### 3. **성능 최적화**
- 대량 데이터는 batch insert 사용
- 불필요한 시드 데이터 최소화
- 테스트별로 필요한 데이터만 생성

## 🔍 트러블슈팅

### 일반적인 문제들

#### 1. **"Database connection failed"**
```bash
# PostgreSQL이 실행 중인지 확인
npm run docker:up
# 또는
brew services start postgresql
```

#### 2. **"User already exists"**
- 시드는 기존 데이터가 있으면 건너뜀
- 강제 재실행하려면: `npm run seed:reset`

#### 3. **"Permission denied"**
```bash
# .env 파일의 데이터베이스 설정 확인
DATABASE_HOST=localhost
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
```

#### 4. **"Module not found"**
```bash
# 의존성 설치 확인
npm install
```

## 📝 로그 예시

### 성공적인 시드 실행
```
🌱 시드 데이터 실행 시작...
👥 사용자 시드 데이터 실행 중...
✅ 7명의 사용자 시드 데이터 생성 완료
  - 관리자 (admin@example.com) [ADMIN]
  - 홍길동 (hong@example.com) [USER]
  - 김영희 (kim@example.com) [USER]
  - 박민수 (park@example.com) [USER]
  - 테스트 사용자1 (test1@example.com) [USER]
  - 테스트 사용자2 (test2@example.com) [USER]
  - 개발자 (dev@example.com) [ADMIN]
✅ 모든 시드 데이터 실행 완료!
```

### 기존 데이터가 있는 경우
```
🌱 시드 데이터 실행 시작...
👥 사용자 시드 데이터 실행 중...
이미 7개의 사용자가 존재합니다. 시드 건너뛰기.
✅ 모든 시드 데이터 실행 완료!
```