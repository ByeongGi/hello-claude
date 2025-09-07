# NestJS 헥사고날 아키텍처 가이드 (v2.0)

> **참조**: [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) 레포지토리의 실제 구현 기반

이 문서는 NestJS 환경에서 헥사고날 아키텍처, 도메인 주도 설계(DDD), CQRS 패턴을 효과적으로 적용하기 위한 실용적인 가이드를 제공합니다.

---

## 1. 핵심 아키텍처 원칙 (Core Principles)

우리 프로젝트는 복잡한 비즈니스 요구사항에 유연하게 대응하고, 유지보수성과 테스트 용이성을 극대화하기 위해 다음 4가지 핵심 원칙을 기반으로 합니다.

### 1.1. 헥사고날 아키텍처 (Ports & Adapters)
애플리케이션의 핵심 비즈니스 로직(Application Core)을 외부 세계(UI, DB, 외부 API 등)로부터 격리하는 패턴입니다.
- **Ports**: 애플리케이션 코어가 외부와 통신하기 위한 인터페이스입니다. (예: `UserRepositoryPort`)
- **Adapters**: 포트의 실제 구현체입니다. 외부 세계와 직접 통신하는 역할을 합니다. (예: `UserHttpController`, `UserRepository`)
- **장점**: 외부 기술(Express, TypeORM 등)이 변경되어도 비즈니스 로직은 영향을 받지 않아 유연하고 테스트가 쉽습니다.

### 1.2. 버티컬 슬라이싱 (Vertical Slicing)
전통적인 레이어별(Controller, Service, Repository) 그룹화가 아닌, 기능(Feature) 단위로 코드를 구성하는 방식입니다.
- **구조**: `src/modules` 아래에 `user`, `wallet` 등 기능별로 디렉토리를 분리합니다.
- **장점**: 관련된 코드가 한 곳에 모여 있어 응집도가 높고, 다른 기능에 미치는 영향을 최소화하며, 특정 기능에 대한 파악이 쉽습니다.

### 1.3. 도메인 주도 설계 (DDD)
비즈니스 도메인 자체의 복잡성을 코드로 모델링하는 데 집중하는 설계 방식입니다.
- **구성요소**: `Entity`, `ValueObject`, `Aggregate`, `DomainEvent`, `DomainService` 등을 통해 도메인 모델을 풍부하게 표현합니다.
- **장점**: 비즈니스 규칙이 코드에 명확하게 표현되어 개발자와 도메인 전문가의 소통이 원활해지고, 비즈니스 로직의 누수를 방지합니다.

### 1.4. CQRS (Command Query Responsibility Segregation)
애플리케이션의 상태를 변경하는 책임(Command)과 상태를 조회하는 책임(Query)을 명확하게 분리하는 패턴입니다.
- **Command**: 시스템의 상태를 변경합니다. 보통 복잡한 유효성 검사와 비즈니스 로직을 포함하며, 성공 여부나 ID 정도만 반환합니다. (예: `CreateUserCommand`)
- **Query**: 시스템의 상태를 변경하지 않고 데이터를 조회합니다. 종종 읽기 성능에 최적화된 DTO를 직접 반환합니다. (예: `FindUsersQuery`)
- **장점**: 각 책임에 맞는 최적의 기술과 모델을 적용할 수 있어 시스템의 복잡성을 낮추고 성능을 향상시킬 수 있습니다.

---

## 2. 상세 디렉토리 구조 (Detailed Directory Structure)

### 2.1. 최상위 구조
```
.
├── database/       # DB 마이그레이션 및 시드(Seed) 파일
├── dist/
├── node_modules/
├── src/            # 애플리케이션 소스코드
├── tests/          # E2E, 통합, 성능 테스트
├── .env
├── package.json
└── tsconfig.json
```

### 2.2. `src/modules` - 버티컬 슬라이스 구조
`user` 모듈을 예시로 한 기능 슬라이스의 내부 구조입니다.

```
src/modules/user/
├── commands/               # CQS - Command 관련 로직
│   └── create-user/
│       ├── create-user.command.ts
│       ├── create-user.service.ts      # Command Handler
│       ├── create-user.http.controller.ts  # HTTP Adapter
│       ├── create-user.cli.controller.ts   # CLI Adapter
│       └── graphql-example/            # GraphQL Adapter
├── queries/                # CQS - Query 관련 로직
│   └── find-users/
│       ├── find-users.query.ts
│       ├── find-users.query-handler.ts
│       └── find-users.http.controller.ts
├── domain/                 # DDD - 순수 비즈니스 로직
│   ├── events/
│   ├── value-objects/
│   ├── user.entity.ts
│   ├── user.errors.ts
│   └── user.types.ts
├── database/               # 영속성(Persistence) 관련 로직
│   ├── user.repository.port.ts   # Port
│   └── user.repository.ts        # Adapter
├── dtos/                   # 데이터 전송 객체
├── user.di-tokens.ts       # 의존성 주입을 위한 토큰
├── user.mapper.ts          # 도메인 객체 ↔ DTO/Persistence 변환
└── user.module.ts          # NestJS 모듈 정의
```

### 2.3. `src/libs` - 공유 커널 (Shared Kernel)
여러 모듈에서 공통으로 사용되는, 특정 도메인에 종속되지 않는 코드입니다.

```
src/libs/
├── api/            # API 응답 형식, 페이징 DTO 등
├── application/    # App 컨텍스트, 예외 인터셉터 등
├── db/             # 트랜잭션, 기본 레포지토리 등
├── ddd/            # DDD 빌딩 블록 (AggregateRoot, ValueObject 등)
├── decorators/     # 공통 데코레이터
├── exceptions/     # 공통 예외 클래스
├── ports/          # 공통 포트 (Logger 등)
├── types/          # 공통 타입
├── utils/          # 범용 유틸리티
└── guard.ts        # Guard Clause 유틸리티
```

---

## 3. 요청의 생명주기 (Lifecycle of a Request)

### 3.1. `CreateUser` Command 예시 (HTTP 요청)
1.  **`[Adapter]` `create-user.http.controller.ts`**: HTTP `POST /users` 요청을 받습니다. 요청 Body는 `CreateUserRequestDto`로 유효성 검사를 거칩니다.
2.  **`[Application]`**: 컨트롤러는 DTO를 `CreateUserCommand`로 변환하여 `CommandBus`에 전달합니다.
3.  **`[Application]` `create-user.service.ts`**: `CommandBus`는 해당 커맨드를 처리할 핸들러(서비스)를 찾아 `execute` 메서드를 실행합니다.
4.  **`[Domain]`**: 서비스는 `UserEntity.create()` 팩토리 메서드를 호출하여 도메인 객체를 생성합니다. 이 과정에서 비즈니스 규칙 검증 및 `UserCreatedDomainEvent`가 발생합니다.
5.  **`[Port]` `user.repository.port.ts`**: 서비스는 레포지토리 포트(인터페이스)에 의존하여 `save` 메서드를 호출합니다.
6.  **`[Adapter]` `user.repository.ts`**: 실제 레포지토리는 `UserMapper`를 이용해 도메인 객체를 ORM 엔티티로 변환하고 DB에 저장합니다.
7.  **`[Adapter]`**: 컨트롤러는 성공 응답(예: `201 Created`와 생성된 ID)을 반환합니다.

### 3.2. `FindUsers` Query 예시
1.  **`[Adapter]` `find-users.http.controller.ts`**: HTTP `GET /users` 요청을 받습니다. 쿼리 파라미터는 `FindUsersRequestDto`로 유효성 검사를 거칩니다.
2.  **`[Application]`**: 컨트롤러는 DTO를 `FindUsersQuery`로 변환하여 `QueryBus`에 전달합니다.
3.  **`[Application]` `find-users.query-handler.ts`**: `QueryBus`는 해당 쿼리를 처리할 핸들러를 찾아 `execute` 메서드를 실행합니다.
4.  **`[Adapter]` `user.repository.ts`**: 쿼리 핸들러는 레포지토리를 통해 DB에서 직접 데이터를 조회합니다. 이때, 성능을 위해 도메인 객체를 거치지 않고 바로 `UserResponseDto`에 필요한 데이터를 조회할 수 있습니다.
5.  **`[Adapter]`**: 컨트롤러는 조회된 데이터(`UserResponseDto[]`)를 HTTP 응답으로 반환합니다.

---

## 4. 주요 패턴 구현 가이드 (Key Pattern Implementation)

### 4.1. 도메인 계층
- **Entity**: `entity.base.ts`를 상속받아 고유 ID와 비즈니스 로직을 가집니다.
- **Value Object**: `value-object.base.ts`를 상속받아 불변성을 가지며, `Guard`를 통해 자체적으로 유효성을 검증합니다.
- **Domain Event**: `domain-event.base.ts`를 상속하며, 애그리거트 루트(`AggregateRoot`) 내에서 `addEvent()`로 등록되고, 레포지토리의 `save()`가 끝난 후 발행됩니다.

### 4.2. 어댑터 계층: 여러 종류의 어댑터
하나의 유스케이스(`create-user.service.ts`)는 여러 종류의 어댑터를 가질 수 있습니다. 이는 비즈니스 로직의 재사용성을 극대화합니다.
- `create-user.http.controller.ts`: REST API 요청 처리
- `create-user.cli.controller.ts`: CLI 명령어 처리
- `create-user.graphql-resolver.ts`: GraphQL 요청 처리

### 4.3. 모듈 간 통신: 도메인 이벤트
한 모듈의 변경이 다른 모듈에 영향을 줘야 할 때, 도메인 이벤트를 통해 결합도를 낮춥니다.
- **흐름**: `user` 모듈에서 `UserCreatedDomainEvent`가 발행되면, 이를 구독하는 `wallet` 모듈의 `CreateWalletWhenUserIsCreated.domain-event-handler.ts`가 실행되어 해당 유저의 지갑을 생성합니다.
- **장점**: 각 모듈은 서로를 직접 알 필요 없이, 발행된 이벤트에만 반응하므로 독립성이 유지됩니다.

### 4.4. 의존성 주입: DI Tokens
NestJS에서 인터페이스(Port)를 기반으로 의존성을 주입하기 위해 `user.di-tokens.ts` 파일을 사용합니다.
```typescript
// user.di-tokens.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// user.module.ts
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    // ...
  ],
})
export class UserModule {}

// create-user.service.ts
export class CreateUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}
}
```

---

## 5. 테스트 전략 (Testing Strategy)

- **Unit Tests (`/src/**/*.spec.ts`)**: 도메인 계층의 비즈니스 로직을 외부 의존성 없이 테스트합니다. 순수하고 실행 속도가 가장 빠릅니다.
- **Integration Tests (`/tests/**/*.spec.ts`)**: 하나의 유스케이스가 데이터베이스를 포함한 여러 구성요소와 올바르게 통합되어 동작하는지 검증합니다.
- **E2E Tests (`/tests/**/*.e2e-spec.ts`)**: 실제 사용자 관점에서 API 엔드포인트가 처음부터 끝까지 정상적으로 동작하는지 검증합니다.
- **BDD (`*.feature`)**: Cucumber와 Gherkin 문법을 사용하여 비즈니스 요구사항 자체를 테스트 시나리오로 작성합니다.
- **Performance Tests (`*.artillery.yaml`)**: Artillery를 사용하여 특정 API에 대한 부하 테스트를 수행하고 성능 병목을 찾습니다.
