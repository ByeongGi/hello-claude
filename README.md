# 사용자 관리 시스템 - NestJS CRUD API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">헥사고날 아키텍처 기반의 사용자 관리 및 JWT 인증 시스템</p>

## 📝 프로젝트 개요

NestJS 기반의 현대적인 백엔드 API 시스템으로, 헥사고날 아키텍처를 적용한 사용자 관리 및 인증 기능을 제공합니다. TypeScript의 강력한 타입 안전성과 NestJS의 모듈형 구조를 활용하여 확장 가능하고 유지보수가 용이한 시스템을 구축했습니다.

### 🏗️ 주요 특징

- **헥사고날 아키텍처**: 도메인 중심 설계로 높은 유연성과 테스트 용이성 확보
- **JWT 인증 시스템**: 리프레시 토큰 기반의 보안 인증 체계
- **TypeScript 완전 지원**: 컴파일 타임 타입 안전성 보장
- **자동 API 문서화**: Swagger/OpenAPI 3.0 통합
- **포괄적 테스트**: 유닛/통합/E2E 테스트 구성
- **Docker 지원**: 개발 및 배포 환경 컨테이너화

## 🛠️ 기술 스택

### Core Framework
- **NestJS** v11.0 - 확장 가능한 Node.js 서버사이드 프레임워크
- **TypeScript** v5.7 - 정적 타입 지원 JavaScript 상위 집합

### Database & ORM
- **PostgreSQL** - 엔터프라이즈급 관계형 데이터베이스
- **TypeORM** v0.3.26 - 타입스크립트 친화적 ORM

### Authentication & Security
- **JWT** + **Passport** - JSON Web Token 기반 인증
- **bcrypt** v6.0 - 비밀번호 해시 및 검증

### Validation & Documentation
- **class-validator** v0.14 - 데코레이터 기반 데이터 검증
- **class-transformer** v0.5 - 객체 변환 및 직렬화
- **Swagger** v11.2 - 자동 API 문서 생성

### Testing & Development
- **Jest** v30.0 - 테스트 프레임워크
- **Supertest** v7.0 - HTTP 어설션 테스팅
- **ESLint** + **Prettier** - 코드 품질 관리

## 🏛️ 아키텍처 구조

```
src/
├── domain/                 # 도메인 계층 - 비즈니스 엔티티
│   └── users/
│       └── user.entity.ts
├── application/           # 애플리케이션 계층 - 유스케이스
│   ├── auth/             # 인증 서비스
│   ├── users/            # 사용자 서비스
│   └── common/           # 공통 애플리케이션 로직
└── infrastructure/       # 인프라스트럭처 계층 - 외부 어댑터
    ├── auth/            # 인증 컨트롤러 & 가드
    ├── users/           # 사용자 컨트롤러 & 레포지토리
    ├── database/        # DB 설정 및 시드
    └── health/          # 헬스체크
```

### 헥사고날 아키텍처 원칙
- **Domain Layer**: 핵심 비즈니스 로직 및 엔티티 (순수 도메인)
- **Application Layer**: 유스케이스 및 포트 정의 (비즈니스 규칙)
- **Infrastructure Layer**: 어댑터 구현 (외부 시스템 연동)

## 🚀 시작하기

### 환경 요구사항
- Node.js v20+ 
- PostgreSQL v13+
- npm v9+

### 설치 및 실행

```bash
# 1. 의존성 설치
$ npm install

# 2. 환경 변수 설정
$ cp .env.example .env

# 3. 데이터베이스 실행 (Docker 사용시)
$ npm run docker:up

# 4. 데이터베이스 시드 실행
$ npm run seed

# 5. 개발 서버 시작
$ npm run start:dev
```

### Docker를 이용한 전체 환경 실행

```bash
# Docker 환경에서 전체 실행
$ npm run dev:docker

# 로그 확인
$ npm run docker:logs

# 환경 중지
$ npm run docker:down
```

## 📝 사용 가능한 스크립트

### 개발 & 실행
```bash
# 개발 모드 (자동 재시작)
$ npm run start:dev

# 디버그 모드
$ npm run start:debug

# 프로덕션 빌드
$ npm run build
$ npm run start:prod
```

### 테스트
```bash
# 유닛 테스트
$ npm run test

# E2E 테스트
$ npm run test:e2e

# 테스트 커버리지
$ npm run test:cov

# 테스트 감시 모드
$ npm run test:watch

# Docker 환경 E2E 테스트
$ npm run test:docker
```

### 코드 품질
```bash
# 린트 체크 및 수정
$ npm run lint

# 코드 포맷팅
$ npm run format
```

### 데이터베이스
```bash
# 시드 데이터 삽입
$ npm run seed

# 시드 데이터 제거
$ npm run seed:clear

# 시드 데이터 리셋 (제거 후 재삽입)
$ npm run seed:reset

# 시드 상태 확인
$ npm run seed:status
```

### Docker 관리
```bash
# 컨테이너 시작
$ npm run docker:up

# 컨테이너 중지
$ npm run docker:down

# 컨테이너 재시작
$ npm run docker:restart

# 로그 확인
$ npm run docker:logs

# 완전 정리 (볼륨 포함)
$ npm run docker:clean
```

### API 문서
```bash
# API 문서 보기 (개발 서버 실행 후)
$ npm run docs:open

# API 클라이언트 코드 생성
$ npm run docs:generate
```

## 📋 API 엔드포인트

### 인증 (Authentication)
```
POST   /auth/login         # 로그인
POST   /auth/refresh       # 토큰 갱신
```

### 사용자 (Users)
```
GET    /users              # 사용자 목록 조회 (페이징)
GET    /users/:id          # 특정 사용자 조회
POST   /users              # 새 사용자 생성
PATCH  /users/:id          # 사용자 정보 수정
DELETE /users/:id          # 사용자 삭제
```

### 헬스체크 (Health)
```
GET    /health             # 서비스 상태 확인
```

### API 문서
- **Swagger UI**: http://localhost:3000/api
- **JSON Schema**: http://localhost:3000/api-json

## 🔐 인증 및 보안

### JWT 토큰 시스템
- **Access Token**: 15분 만료, API 접근용
- **Refresh Token**: 7일 만료, 토큰 갱신용
- **Bearer Token** 형식으로 Authorization 헤더에 포함

### 보안 기능
- 비밀번호 bcrypt 해시화
- Role 기반 접근 제어 (RBAC)
- 입력 데이터 자동 검증
- SQL Injection 방지 (TypeORM)
- XSS 방지 (class-validator)

## 🧪 테스트

### 테스트 전략
- **유닛 테스트**: 개별 서비스 로직 검증
- **통합 테스트**: 컨트롤러-서비스 통합 검증  
- **E2E 테스트**: 전체 API 워크플로우 검증

### 커버리지 목표
- **유닛 테스트**: 90%+
- **통합 테스트**: 80%+
- **E2E 테스트**: 주요 시나리오 100%

## 📊 데이터베이스

### ERD (Entity Relationship Diagram)
```
User Entity:
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- name (String)
- role (Enum: USER, ADMIN)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

상세한 데이터베이스 스키마는 [데이터베이스 문서](docs/database-schema.md)를 참고하세요.

## 🐳 Docker 지원

### 개발 환경
```yaml
services:
  - PostgreSQL 13
  - pgAdmin 4 (데이터베이스 관리)
  - Redis (캐시, 선택사항)
```

### 환경 파일
- `.env.docker`: Docker 환경 설정
- `.env.example`: 환경 변수 템플릿
- `docker-compose.yml`: 서비스 오케스트레이션

## 📚 문서

### 프로젝트 문서
- [시스템 아키텍처](docs/architecture.md)
- [데이터베이스 스키마](docs/database-schema.md)
- [배포 가이드](docs/deployment.md)
- [시드 데이터 가이드](docs/database-seeding-guide.md)

### Claude Code 활용 가이드
- [코드 리뷰 요청 방법](docs/claude/how-to-request-code-review.md)
- [테스트 코드 작성 가이드](docs/claude/how-to-write-test-code.md)
- [리팩토링 가이드](docs/claude/how-to-refactor-code.md)

## 🤝 개발 가이드

### 브랜치 전략
```
main                    # 프로덕션 브랜치
├── develop            # 개발 통합 브랜치  
├── feature/auth-jwt   # 기능 개발 브랜치
└── hotfix/security    # 긴급 수정 브랜치
```

### 커밋 메시지 규칙
```
feat(auth): JWT 리프레시 토큰 기능 추가
fix(user): 이메일 중복 검증 로직 수정
test(api): 사용자 CRUD E2E 테스트 추가
docs(readme): API 엔드포인트 문서 업데이트
```

### 코드 스타일
- **ESLint + Prettier** 설정 준수
- **TypeScript strict mode** 사용
- **Conventional Commits** 메시지 형식
- **헥사고날 아키텍처** 계층 분리 원칙

## 📈 성능 및 모니터링

### 성능 지표
- **응답 시간**: 평균 120ms 이하
- **처리량**: 초당 500+ 요청 처리
- **에러율**: 0.5% 미만 목표

### 모니터링
- API 응답 시간 로깅
- 에러 추적 및 알림
- 데이터베이스 성능 모니터링
- 시스템 리소스 사용량 추적

## 🔧 트러블슈팅

### 자주 발생하는 문제

#### 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
$ npm run docker:logs

# 컨테이너 재시작
$ npm run docker:restart
```

#### 포트 충돌
```bash
# 사용 중인 포트 확인
$ lsof -i :3000
$ lsof -i :5432

# 프로세스 종료 후 재시작
$ npm run docker:clean
$ npm run docker:up
```

#### 환경 변수 설정
```bash
# .env 파일 확인
$ cat .env

# Docker 환경 변수 적용
$ cp .env.docker .env
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 👨‍💻 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원 및 문의

### 개발 관련 문의
- 이슈 등록: GitHub Issues
- 기능 요청: Feature Request Template
- 버그 신고: Bug Report Template

### 학습 리소스
- [NestJS 공식 문서](https://docs.nestjs.com)
- [TypeORM 가이드](https://typeorm.io)
- [헥사고날 아키텍처 가이드](https://alistair.cockburn.us/hexagonal-architecture)

---

*이 프로젝트는 현대적인 백엔드 개발 모범 사례를 학습하고 실습하기 위한 교육용 프로젝트입니다.*
