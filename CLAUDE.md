# 사용자 관리 시스템 - NestJS CRUD API

NestJS 기반의 사용자 관리 및 게시글 CRUD 시스템입니다.

## 프로젝트 정보

### 기술 스택
- **Framework**: NestJS v10.4.4
- **Language**: TypeScript 5.6
- **Database**: PostgreSQL + TypeORM 0.3.20
- **Authentication**: JWT + Passport
- **Testing**: Jest 29.7 + Supertest 7.0
- **Documentation**: Swagger/OpenAPI 4.0
- **Validation**: class-validator 0.14 + class-transformer 0.5

### 아키텍처 패턴 (헥사고날 아키텍처)
- **Domain Layer**: 핵심 비즈니스 로직과 엔티티 (도메인 중심)
- **Application Layer**: 유스케이스와 애플리케이션 서비스 (포트 정의)
- **Infrastructure Layer**: 외부 시스템 연동 (어댑터 구현)
  - Database Adapters (TypeORM Repository)
  - Web Adapters (NestJS Controllers)
  - External Service Adapters (Third-party APIs)
- **Port & Adapter 패턴**: 인터페이스를 통한 의존성 역전
- **Clean Architecture 원칙**: 의존성 방향은 항상 내부로

## 개발 규칙

### 코드 스타일
- **Linting**: ESLint + Prettier 설정 준수
- **TypeScript**: 엄격 모드 사용 (`strict: true`)
- **네이밍**: camelCase (변수/메서드), PascalCase (클래스/인터페이스)
- **인터페이스**: I 접두사 사용 (예: `IUserService`)
- **Enum**: 대문자 + 언더스코어 (예: `USER_ROLE`)

### API 설계 원칙
- **RESTful API**: REST 원칙 엄격 준수
- **HTTP 메서드**: GET(조회), POST(생성), PATCH(부분수정), DELETE(삭제)
- **상태 코드**: 의미에 맞는 HTTP 상태 코드 반환
- **응답 형식**: 일관된 ResponseDto 사용
- **에러 형식**: 표준화된 에러 응답 구조
- **페이징**: 큰 데이터셋은 페이징 처리

### 데이터베이스 규칙
- **Entity**: TypeORM 데코레이터 적극 활용
- **컬럼명**: snake_case (DB) ↔ camelCase (코드)
- **관계 매핑**: 적절한 관계 설정 및 cascade 옵션
- **인덱스**: 성능을 위한 필수 인덱스 설정
- **마이그레이션**: 모든 스키마 변경은 마이그레이션으로 관리

### 보안 규칙
- **인증**: JWT 토큰 기반 인증 시스템
- **인가**: Role-based 권한 시스템
- **입력 검증**: 모든 입력 데이터 class-validator로 검증
- **에러 노출**: 프로덕션에서 내부 에러 정보 숨김
- **CORS**: 허용된 출처만 접근 가능
- **Rate Limiting**: API 호출 제한

### 테스트 규칙
- **유닛 테스트**: 모든 서비스 메서드 100% 커버리지
- **통합 테스트**: Controller 레벨 API 테스트
- **E2E 테스트**: 주요 사용자 플로우 테스트
- **Mock**: 외부 의존성 Mock 처리
- **TDD**: 중요한 로직은 테스트 우선 개발

## 현재 프로젝트 상태

### 완성도
- **사용자 모듈**: 95% (CRUD 완료, 프로필 이미지 제외)
- **인증 모듈**: 90% (JWT 토큰, 리프레시 토큰 구현)
- **게시글 모듈**: 80% (기본 CRUD, 댓글 시스템 예정)
- **공통 모듈**: 70% (에러 처리, 로깅, 검증)
- **문서화**: 95% (ERD, 아키텍처, 배포 가이드 완료)

### 성능 지표
- **응답 시간**: 평균 120ms
- **처리량**: 초당 500건 처리 가능
- **에러율**: 0.5% 미만
- **테스트 커버리지**: 85%

### 배포 환경
- **개발 서버**: http://localhost:3000 (로컬)
- **스테이징**: 미구성 (Docker 설정 준비됨)
- **운영 서버**: 미배포 (배포 가이드 문서 완료)
- **모니터링**: 기본 로깅만 구현 (고급 모니터링 설정 가이드 포함)

## 개선 우선순위

### 🔴 높음 (High Priority)
1. **테스트 커버리지 95% 달성** - 안정성 확보
2. **전역 에러 처리 표준화** - 일관된 에러 응답
3. **API 응답 속도 최적화** - 200ms 이하 목표
4. **보안 강화** - Rate limiting, CORS 세밀 설정

### 🟡 중간 (Medium Priority)
1. **로깅 시스템 개선** - 구조화된 로그, 로그 레벨 관리
2. **API 문서 자동화** - Swagger 세팅 완성
3. **데이터베이스 최적화** - 쿼리 성능 개선, 인덱스 최적화
4. **환경별 설정 관리** - dev/staging/prod 환경 분리 (Docker 기반 준비됨)

### 🟢 낮음 (Low Priority)
1. **캐싱 시스템 도입** - Redis 활용한 성능 개선 (Docker Compose 설정 포함)
2. **실시간 기능** - WebSocket 기반 알림 시스템
3. **이미지 업로드** - AWS S3 연동
4. **메일 시스템** - 회원가입 인증, 알림 메일 (SMTP 설정 가이드 포함)

## Claude Code 활용 가이드

### 코드 리뷰 요청 시
```
"이 UserService 코드를 NestJS 모범 사례에 따라 리뷰해주세요. 
특히 에러 처리, 성능, 보안 측면을 중점적으로 검토해주세요."

"TypeORM 쿼리 최적화 관점에서 이 코드를 개선해주세요."
```

### 새 기능 개발 시
```
"기존 User 모듈 패턴을 따라서 Post 모듈을 구현해주세요. 
CRUD 기능과 적절한 DTO, Entity를 포함해서요."

"JWT 인증이 필요한 API 엔드포인트를 만들어주세요."
```

### 리팩토링 시
```
"이 컨트롤러가 너무 비대합니다. 단일 책임 원칙에 따라 
서비스 계층으로 로직을 분리해주세요."

"중복되는 validation 로직을 커스텀 데코레이터로 추출해주세요."
```

### 테스트 작성 시
```
"UserService의 createUser 메서드에 대한 완전한 테스트 스위트를 작성해주세요. 
성공/실패 케이스, Edge case 모두 포함해서요."

"/auth/login 엔드포인트에 대한 E2E 테스트를 작성해주세요."
```

### 디버깅 시
```
"다음 TypeORM 에러의 원인을 분석해주세요: [에러 메시지]"

"API 응답 속도가 느린 원인을 찾고 최적화 방안을 제시해주세요."
```

### 배포 관련 요청 시
```
"Docker를 사용해서 개발 환경을 구성해주세요."

"PM2를 이용한 프로덕션 배포 설정을 도와주세요."

"Nginx 리버스 프록시 설정을 검토해주세요."

"데이터베이스 마이그레이션을 안전하게 실행하는 방법을 알려주세요."
```

## 금지 사항

### ❌ 절대 하지 말 것
- **데이터베이스 스키마 함부로 변경** (마이그레이션 없이)
- **공통 인터페이스 임의 변경** (다른 모듈 영향)
- **환경 변수나 설정 무단 수정**
- **외부 라이브러리 무분별 추가**
- **테스트 없이 핵심 로직 변경**
- **에러 처리 생략**

### ✅ 반드시 할 것
- **기존 아키텍처 패턴 준수**
- **DTO 검증 규칙 적용**
- **적절한 HTTP 상태 코드 사용**
- **테스트 코드 함께 작성**
- **TypeScript 타입 안전성 확보**
- **API 문서 업데이트**

## 팀 협업 가이드

### Git 워크플로우
- **브랜치 전략**: feature/[모듈명-기능명] (예: feature/user-profile-image)
- **커밋 메시지**: type(scope): description 형식
  ```
  feat(auth): JWT 리프레시 토큰 기능 추가
  fix(user): 이메일 중복 검증 로직 수정
  test(post): 게시글 CRUD API 테스트 추가
  ```
- **PR 규칙**: 코드 리뷰 필수, CI 테스트 통과 후 머지
- **코드 리뷰**: 최소 1명 승인 필요

### 개발 환경 설정
```bash
# 개발 환경 시작
npm run start:dev

# 테스트 실행
npm run test
npm run test:e2e

# 린트 체크
npm run lint
npm run format

# 데이터베이스
npm run migration:run
npm run migration:revert
```

### 코드 리뷰 체크리스트
- [ ] **아키텍처**: 기존 모듈 패턴 준수
- [ ] **타입 안전성**: TypeScript 엄격 모드 준수
- [ ] **에러 처리**: 적절한 예외 처리 및 응답
- [ ] **검증**: DTO validation 규칙 적용
- [ ] **테스트**: 테스트 코드 포함 및 커버리지
- [ ] **문서**: API 문서 업데이트
- [ ] **성능**: 쿼리 최적화 및 성능 고려
- [ ] **보안**: 인증/인가 및 입력 검증

### 이슈 트래킹
- **버그**: GitHub Issues에 재현 방법과 함께 등록
- **기능 요청**: 요구사항과 수용 기준 명시
- **개선사항**: 현재 상태와 개선 목표 기술

## 참고 자료

### 공식 문서
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 가이드](https://typeorm.io/)
- [Jest 테스팅](https://jestjs.io/)
- [class-validator](https://github.com/typestack/class-validator)

### 프로젝트 내부 문서
- API 문서: http://localhost:3000/api (Swagger)
- 데이터베이스 ERD: `docs/database-schema.md`
- 아키텍처 다이어그램: `docs/architecture.md`
- 배포 가이드: `docs/deployment.md`
- Claude Code 활용 가이드: `docs/claude/` 디렉토리
  - 코드 리뷰 요청 방법: `docs/claude/how-to-request-code-review.md`
  - 테스트 코드 작성 가이드: `docs/claude/how-to-write-test-code.md`
  - 리팩토링 가이드: `docs/claude/how-to-refactor-code.md`

---

## 업데이트 히스토리

### 2025-09-06 (v1.0.1)
- ✅ 누락된 프로젝트 문서 생성 완료
  - 데이터베이스 ERD 문서 (`docs/database-schema.md`)
  - 시스템 아키텍처 문서 (`docs/architecture.md`)
  - 배포 가이드 문서 (`docs/deployment.md`)
- ✅ Claude Code 활용 가이드 문서 추가
- 📋 문서 구조 완성도 95% 달성