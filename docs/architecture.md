# 시스템 아키텍처

## 개요
NestJS 기반 사용자 관리 및 게시글 CRUD 시스템의 아키텍처 설계 문서입니다.

## 아키텍처 원칙

### 헥사고날 아키텍처 (Hexagonal Architecture)
```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │ Database │  │   JWT    │  │  Email   │   │
│  │ Client   │  │PostgreSQL│  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────┬─────────────┬─────────────┬─────────────┬────┘
              │             │             │             │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
        │   HTTP    │ │ Database  │ │   Auth    │ │   Mail    │
        │  Adapter  │ │  Adapter  │ │  Adapter  │ │  Adapter  │
        │(NestJS    │ │(TypeORM   │ │(Passport  │ │(NodeMail  │
        │Controller)│ │Repository)│ │ Strategy) │ │   er)     │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │             │             │             │
┌─────────────┼─────────────┼─────────────┼─────────────┼────┐
│             │    Infrastructure Layer   │             │    │
│             │                           │             │    │
│        ┌────▼──────────────────────────▼─────────────▼────┐│
│        │              Application Layer               │││
│        │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐││
│        │  │    User     │  │    Post     │  │    Auth     │││
│        │  │   Service   │  │   Service   │  │   Service   │││
│        │  └─────────────┘  └─────────────┘  └─────────────┘││
│        └────┬─────────────────┬─────────────────┬──────────┘│
│             │                 │                 │           │
│        ┌────▼─────────────────▼─────────────────▼──────────┐│
│        │                Domain Layer                       ││
│        │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐││
│        │  │    User     │  │    Post     │  │  Business   │││
│        │  │   Entity    │  │   Entity    │  │   Rules     │││
│        │  └─────────────┘  └─────────────┘  └─────────────┘││
│        └───────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

## 레이어 상세 설명

### 1. Domain Layer (도메인 계층)
**역할**: 핵심 비즈니스 로직과 엔티티 정의

**구성요소**:
- **Entities**: 비즈니스 객체 (User, Post, Comment)
- **Value Objects**: 불변 값 객체
- **Domain Events**: 도메인 이벤트
- **Business Rules**: 비즈니스 규칙 및 제약조건

### 2. Application Layer (애플리케이션 계층)
**역할**: 유스케이스 조합 및 애플리케이션 서비스

**구성요소**:
- **Use Cases**: 구체적인 비즈니스 시나리오
- **Application Services**: 유스케이스 조합
- **Ports**: 외부 시스템과의 인터페이스 정의
- **DTOs**: 데이터 전송 객체

### 3. Infrastructure Layer (인프라 계층)
**역할**: 외부 시스템과의 실제 연동 구현

**구성요소**:
- **Database Adapters**: TypeORM Repository 구현
- **Web Adapters**: NestJS Controllers
- **External Service Adapters**: 이메일, SMS 등 외부 서비스
- **Configuration**: 환경설정 관리

## API 설계

### RESTful API 구조
```
GET    /api/v1/users              # 사용자 목록 조회
POST   /api/v1/users              # 사용자 생성
GET    /api/v1/users/:id          # 특정 사용자 조회
PATCH  /api/v1/users/:id          # 사용자 정보 수정
DELETE /api/v1/users/:id          # 사용자 삭제

POST   /api/v1/auth/login         # 로그인
POST   /api/v1/auth/refresh       # 토큰 갱신
POST   /api/v1/auth/logout        # 로그아웃

GET    /api/v1/posts              # 게시글 목록 조회
POST   /api/v1/posts              # 게시글 생성
GET    /api/v1/posts/:id          # 특정 게시글 조회
PATCH  /api/v1/posts/:id          # 게시글 수정
DELETE /api/v1/posts/:id          # 게시글 삭제
```

## 보안 아키텍처

### 인증/인가 플로우
```
Client → JWT Token → Auth Guard → Route Handler
   ↓
JWT Strategy → User Service → Database
   ↓
User Context → Authorization Guard → Business Logic
```

### 보안 계층
1. **네트워크 보안**: HTTPS, CORS 설정
2. **인증 보안**: JWT 토큰, 패스워드 해싱 (bcrypt)
3. **인가 보안**: Role-based Access Control (RBAC)
4. **입력 보안**: class-validator, SQL Injection 방지
5. **출력 보안**: 민감 정보 필터링

## 성능 최적화

### 데이터베이스 최적화
- **인덱싱 전략**: 자주 조회되는 컬럼에 인덱스 설정
- **쿼리 최적화**: N+1 문제 해결, 적절한 JOIN 사용
- **연결 풀링**: TypeORM 연결 풀 최적화

### 모니터링 및 로깅
- **APM**: 애플리케이션 성능 모니터링
- **로깅**: 구조화된 로그 (JSON 형태)
- **메트릭**: 응답 시간, 에러율, 처리량 모니터링

## 테스트 전략

### 테스트 피라미드
```
    ┌─────────────┐
    │   E2E Tests │ (적은 수, 높은 신뢰도)
    └─────────────┘
  ┌───────────────────┐
  │ Integration Tests │ (중간 수)
  └───────────────────┘
┌─────────────────────────┐
│     Unit Tests          │ (많은 수, 빠른 실행)
└─────────────────────────┘
```

### 테스트 범위
- **Unit Tests**: 도메인 로직, 서비스 메서드
- **Integration Tests**: 컨트롤러, 리포지토리
- **E2E Tests**: 전체 API 플로우

## 향후 확장 계획

### Phase 1 (현재)
- 기본 CRUD 기능
- JWT 인증
- 기본 테스트

### Phase 2 (단기)
- 댓글 시스템
- 파일 업로드
- 검색 기능

### Phase 3 (중기)
- 실시간 알림 (WebSocket)
- 캐싱 시스템 (Redis)
- API Rate Limiting

### Phase 4 (장기)
- 마이크로서비스 분리
- 메시지 큐 시스템
- 고급 모니터링