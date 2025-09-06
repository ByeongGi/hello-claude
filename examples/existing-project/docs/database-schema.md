# 데이터베이스 스키마 (ERD)

## 개요
NestJS 사용자 관리 및 게시글 CRUD 시스템의 데이터베이스 설계 문서입니다.

## 데이터베이스 정보
- **DBMS**: PostgreSQL
- **ORM**: TypeORM 0.3.20
- **네이밍 규칙**: 
  - 테이블명: snake_case
  - 컬럼명: snake_case
  - 인덱스명: idx_[테이블명]_[컬럼명]

## 엔티티 관계도

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     posts       │       │    comments     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ author_id (FK)  │◄──────┤ post_id (FK)    │
│ email (UNIQUE)  │       │ id (PK)         │       │ id (PK)         │
│ username        │       │ title           │       │ content         │
│ password        │       │ content         │       │ author_id (FK)  │──┐
│ role            │       │ created_at      │       │ created_at      │  │
│ is_active       │       │ updated_at      │       │ updated_at      │  │
│ created_at      │       │ deleted_at      │       │ deleted_at      │  │
│ updated_at      │       └─────────────────┘       └─────────────────┘  │
│ deleted_at      │                                                       │
└─────────────────┘◄──────────────────────────────────────────────────────┘
```

## 테이블 상세 정보

### users 테이블
사용자 정보를 저장하는 메인 테이블

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|-------------|----------|------|
| id | SERIAL | PRIMARY KEY | 사용자 고유 ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 이메일 (로그인 ID) |
| username | VARCHAR(50) | NOT NULL | 사용자명 |
| password | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | 사용자 역할 (USER, ADMIN) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 계정 활성 상태 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| deleted_at | TIMESTAMP | NULL | 삭제일시 (소프트 삭제) |

### posts 테이블
게시글 정보를 저장하는 테이블

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|-------------|----------|------|
| id | SERIAL | PRIMARY KEY | 게시글 고유 ID |
| title | VARCHAR(200) | NOT NULL | 게시글 제목 |
| content | TEXT | NOT NULL | 게시글 내용 |
| author_id | INTEGER | NOT NULL, FOREIGN KEY | 작성자 ID (users.id 참조) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| deleted_at | TIMESTAMP | NULL | 삭제일시 (소프트 삭제) |

### comments 테이블 (예정)
게시글 댓글 정보를 저장하는 테이블

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|-------------|----------|------|
| id | SERIAL | PRIMARY KEY | 댓글 고유 ID |
| content | TEXT | NOT NULL | 댓글 내용 |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 게시글 ID (posts.id 참조) |
| author_id | INTEGER | NOT NULL, FOREIGN KEY | 작성자 ID (users.id 참조) |
| parent_id | INTEGER | NULL, FOREIGN KEY | 부모 댓글 ID (대댓글용) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| deleted_at | TIMESTAMP | NULL | 삭제일시 (소프트 삭제) |

## 인덱스 설계

### users 테이블 인덱스
- `idx_users_email`: email 컬럼 (로그인 성능 최적화)
- `idx_users_username`: username 컬럼 (검색 성능 최적화)
- `idx_users_role`: role 컬럼 (역할별 조회 최적화)
- `idx_users_is_active`: is_active 컬럼 (활성 사용자 조회)

### posts 테이블 인덱스
- `idx_posts_author_id`: author_id 컬럼 (작성자별 게시글 조회)
- `idx_posts_created_at`: created_at 컬럼 (시간순 정렬)
- `idx_posts_title`: title 컬럼 (제목 검색)

### comments 테이블 인덱스 (예정)
- `idx_comments_post_id`: post_id 컬럼 (게시글별 댓글 조회)
- `idx_comments_author_id`: author_id 컬럼 (작성자별 댓글 조회)
- `idx_comments_parent_id`: parent_id 컬럼 (대댓글 조회)

## 관계 정의

### users ↔ posts (1:N)
- 한 사용자는 여러 게시글을 작성할 수 있음
- 외래키: posts.author_id → users.id
- 삭제 정책: CASCADE (사용자 삭제 시 게시글도 소프트 삭제)

### users ↔ comments (1:N, 예정)
- 한 사용자는 여러 댓글을 작성할 수 있음
- 외래키: comments.author_id → users.id
- 삭제 정책: CASCADE (사용자 삭제 시 댓글도 소프트 삭제)

### posts ↔ comments (1:N, 예정)
- 한 게시글에 여러 댓글이 달릴 수 있음
- 외래키: comments.post_id → posts.id
- 삭제 정책: CASCADE (게시글 삭제 시 댓글도 소프트 삭제)

### comments ↔ comments (1:N, 예정)
- 댓글에 대댓글이 달릴 수 있음 (자기 참조)
- 외래키: comments.parent_id → comments.id
- 삭제 정책: SET NULL (부모 댓글 삭제 시 parent_id를 NULL로 설정)

## 제약 조건

### 비즈니스 규칙
1. **이메일 유일성**: 같은 이메일로 중복 가입 불가
2. **소프트 삭제**: 모든 테이블에서 deleted_at을 활용한 논리적 삭제
3. **역할 기반 권한**: USER, ADMIN 역할에 따른 접근 제한
4. **활성 사용자만 작성**: is_active가 true인 사용자만 게시글/댓글 작성 가능

### 데이터 무결성
1. **참조 무결성**: 외래키 제약조건으로 데이터 일관성 보장
2. **필수 필드**: NOT NULL 제약조건으로 필수 데이터 보장
3. **데이터 길이**: VARCHAR 길이 제한으로 적절한 데이터 크기 관리

## 성능 최적화

### 쿼리 최적화
1. **복합 인덱스 고려사항**:
   - `idx_posts_author_deleted` (author_id, deleted_at): 작성자별 활성 게시글 조회
   - `idx_posts_created_deleted` (created_at, deleted_at): 최신 활성 게시글 조회

2. **파티셔닝 고려사항** (향후):
   - posts 테이블: created_at 기준 월별 파티셔닝
   - comments 테이블: created_at 기준 월별 파티셔닝

### 데이터 아카이빙
1. **오래된 데이터 처리**: 1년 이상된 삭제 데이터 아카이브 테이블로 이관
2. **로그 데이터 분리**: 감사 로그는 별도 테이블로 관리

## 마이그레이션 히스토리

### v1.0.0 - 초기 스키마
- users, posts 테이블 생성
- 기본 인덱스 및 제약조건 설정

### v1.1.0 - 댓글 시스템 (예정)
- comments 테이블 추가
- 대댓글 지원을 위한 parent_id 컬럼 추가

### v1.2.0 - 성능 개선 (예정)
- 복합 인덱스 추가
- 쿼리 성능 최적화

## 백업 및 복구 정책

### 백업 전략
- **일일 백업**: 매일 자정 전체 데이터베이스 백업
- **증분 백업**: 매시간 변경된 데이터만 백업
- **백업 보관**: 30일간 보관 후 월별 아카이브

### 복구 계획
- **RTO**: 4시간 이내 서비스 복구
- **RPO**: 1시간 이내 데이터 손실 허용
- **테스트**: 월 1회 백업 복구 테스트 실시