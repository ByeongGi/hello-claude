# Claude Code로 체계적인 리팩토링하기

> 헥사고날 아키텍처 기반 NestJS 프로젝트에서 Claude Code를 활용한 안전하고 효율적인 리팩토링 가이드

## 🎯 리팩토링 전략

### 1. 사전 분석 단계

#### 📊 현재 상태 파악 요청
```
현재 프로젝트의 아키텍처 현황을 분석해주세요:

1. **의존성 분석**: 
   - 순환 의존성이 있는지 확인
   - 계층 간 의존성 방향이 올바른지 검증
   
2. **코드 품질 지표**:
   - 복잡도가 높은 클래스/메서드 식별
   - 중복 코드 패턴 발견
   - 테스트 커버리지 낮은 부분 파악

3. **헥사고날 아키텍처 준수도**:
   - Domain 계층의 순수성 검증
   - Port/Adapter 분리 상태 확인
   - 비즈니스 로직 위치 적절성 검토

전체 src/ 폴더를 분석하여 리팩토링 우선순위를 제안해주세요.
```

#### 🔍 Claude의 분석 결과 예시
```markdown
## 📊 프로젝트 아키텍처 분석 결과

### ❌ 발견된 문제점

1. **의존성 문제**
   - `UserController`가 `UserRepository`를 직접 의존 (계층 위반)
   - `PostService`에서 `EmailService` 직접 호출 (Infrastructure 의존)

2. **코드 복잡도**
   - `UserService.updateUserProfile()`: 복잡도 15 (권장: 10 이하)
   - 중복된 검증 로직이 3개 서비스에서 반복

3. **아키텍처 위반**
   - 비즈니스 로직이 Controller에 scattered
   - Domain Entity가 ORM 애노테이션 포함

### 🎯 리팩토링 우선순위

1. **High Priority**: 의존성 방향 수정 (안정성 영향)
2. **Medium**: 비즈니스 로직 Domain으로 이동
3. **Low**: 코드 중복 제거 및 최적화
```

### 2. 단계별 리팩토링 접근

#### Phase 1: 의존성 구조 개선
```
다음 순서로 의존성 문제를 해결해주세요:

1. **UserController 리팩토링**:
   - UserRepository 직접 의존성 제거
   - UseCase 패턴으로 변경
   - 적절한 DTO 변환 로직 추가

2. **Port 인터페이스 생성**:
   - EmailService → NotificationPort
   - FileService → StoragePort
   - 기존 구현체를 Adapter로 변환

각 단계마다 기존 기능이 깨지지 않도록 점진적으로 진행해주세요.
```

## 📚 실전 리팩토링 사례

### 사례 1: Anemic Domain Model → Rich Domain Model

#### 🔴 리팩토링 전 (Anemic Domain)
```typescript
// src/domain/user/entities/user.entity.ts
export class User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/application/user/services/user.service.ts
@Injectable()
export class UserService {
  async updateUserProfile(id: string, name: string, email: string): Promise<void> {
    // 🚨 비즈니스 로직이 서비스에 있음
    if (!name || name.length < 2) {
      throw new Error('이름은 2자 이상이어야 합니다.');
    }
    
    if (!email.includes('@')) {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    }
    
    const user = await this.userRepository.findById(id);
    user.name = name;
    user.email = email;
    user.updatedAt = new Date();
    
    await this.userRepository.save(user);
  }
}
```

#### 💬 Claude 리팩토링 요청
```
위 코드를 Rich Domain Model 패턴으로 리팩토링해주세요:

1. 비즈니스 로직을 Domain Entity로 이동
2. 값 객체(Value Objects) 도입
3. 도메인 이벤트 적용
4. 불변성 보장

헥사고날 아키텍처 원칙을 준수하여 진행해주세요.
```

#### ✅ 리팩토링 후 (Rich Domain)
```typescript
// src/domain/user/entities/user.entity.ts
import { Email } from '../value-objects/email.vo';
import { UserName } from '../value-objects/user-name.vo';
import { UserRole } from '../value-objects/user-role.vo';
import { DomainEvent } from '../../shared/domain-event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';

export class User {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    private readonly _id: string,
    private _email: Email,
    private _name: UserName,
    private _role: UserRole,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ✅ 비즈니스 로직이 도메인에 위치
  updateProfile(name: UserName, email: Email): void {
    const oldEmail = this._email;
    
    this._name = name;
    this._email = email;
    this._updatedAt = new Date();
    
    // ✅ 도메인 이벤트 발생
    if (!email.equals(oldEmail)) {
      this.addDomainEvent(new UserProfileUpdatedEvent(this._id, email.value));
    }
  }

  changeRole(newRole: UserRole, currentUserRole: UserRole): void {
    if (!currentUserRole.canChangeRoleTo(newRole)) {
      throw new DomainException('권한이 없습니다.');
    }
    
    this._role = newRole;
    this._updatedAt = new Date();
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Getters
  get id(): string { return this._id; }
  get email(): Email { return this._email; }
  get name(): UserName { return this._name; }
  get role(): UserRole { return this._role; }
}

// src/application/user/use-cases/update-user-profile.use-case.ts
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // ✅ 도메인 로직 호출
    user.updateProfile(
      new UserName(command.name),
      new Email(command.email)
    );

    await this.userRepository.save(user);
    
    // ✅ 도메인 이벤트 발행
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();
  }
}
```

### 사례 2: Layered Architecture → Hexagonal Architecture

#### 🔴 기존 Layered 구조
```typescript
// src/modules/user/user.controller.ts
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService, // 🚨 Service 직접 의존
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto); // 🚨 비즈니스 로직 위임
  }
}

// src/modules/user/user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // 🚨 ORM 직접 의존
    private readonly emailService: EmailService, // 🚨 Infrastructure 직접 의존
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 🚨 모든 로직이 Service에 집중
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email }
    });
    
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const user = this.userRepository.create(dto);
    const savedUser = await this.userRepository.save(user);
    
    await this.emailService.sendWelcomeEmail(user.email);
    
    return savedUser;
  }
}
```

#### 💬 리팩토링 요청
```
위 Layered Architecture를 Hexagonal Architecture로 단계별 리팩토링해주세요:

1. **Domain Layer 분리**: 
   - User Entity를 순수 도메인 객체로 변환
   - 비즈니스 로직을 도메인으로 이동

2. **Application Layer 생성**:
   - UseCase 패턴 적용
   - Port 인터페이스 정의

3. **Infrastructure Layer 분리**:
   - Repository Adapter 구현
   - External Service Adapter 구현

기존 API 호환성을 유지하면서 점진적으로 진행해주세요.
```

#### ✅ 헥사고날 구조로 리팩토링

**1단계: Domain Layer 생성**
```typescript
// src/domain/user/entities/user.entity.ts
export class User {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _name: UserName,
    private readonly _createdAt: Date,
  ) {}

  static create(email: Email, name: UserName): User {
    return new User(
      UserId.generate(),
      email,
      name,
      new Date(),
    );
  }

  static reconstitute(
    id: UserId,
    email: Email,
    name: UserName,
    createdAt: Date,
  ): User {
    return new User(id, email, name, createdAt);
  }

  // 비즈니스 로직
  updateEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return; // 변경사항 없음
    }
    
    this._email = newEmail;
  }

  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get name(): UserName { return this._name; }
}

// src/domain/user/repositories/user.repository.ts (Port)
export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
}
```

**2단계: Application Layer 생성**
```typescript
// src/application/user/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationPort: NotificationPort, // Port 사용
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    const email = new Email(command.email);
    const name = new UserName(command.name);
    
    // 비즈니스 규칙 검증
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 도메인 객체 생성
    const user = User.create(email, name);
    
    // 저장
    await this.userRepository.save(user);
    
    // 외부 서비스 호출 (Port를 통해)
    await this.notificationPort.sendWelcomeEmail(user.email.value);
    
    return new CreateUserResult(user.id.value, user.email.value, user.name.value);
  }
}

// src/application/user/ports/notification.port.ts
export abstract class NotificationPort {
  abstract sendWelcomeEmail(email: string): Promise<void>;
}
```

**3단계: Infrastructure Layer 구현**
```typescript
// src/infrastructure/database/repositories/typeorm-user.repository.ts
@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async save(user: User): Promise<void> {
    const ormEntity = UserMapper.toOrmEntity(user);
    await this.ormRepository.save(ormEntity);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { email: email.value }
    });
    
    return ormEntity ? UserMapper.toDomainEntity(ormEntity) : null;
  }
}

// src/infrastructure/web/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase, // UseCase 의존
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    const command = new CreateUserCommand(dto.email, dto.name);
    const result = await this.createUserUseCase.execute(command);
    
    return new CreateUserResponseDto(
      result.id,
      result.email,
      result.name,
    );
  }
}
```

### 사례 3: 복잡한 비즈니스 로직 분리

#### 🔴 God Class 문제
```typescript
// src/services/order.service.ts - 🚨 너무 많은 책임
@Injectable()
export class OrderService {
  async processOrder(orderData: any): Promise<any> {
    // 🚨 검증, 계산, 저장, 알림 등 모든 로직이 한 곳에
    
    // 1. 검증 로직 (50줄)
    if (!orderData.customerId) throw new Error('...');
    // ... 복잡한 검증 로직
    
    // 2. 가격 계산 로직 (100줄) 
    let totalPrice = 0;
    orderData.items.forEach(item => {
      // ... 복잡한 계산 로직
    });
    
    // 3. 재고 확인 로직 (30줄)
    for (const item of orderData.items) {
      // ... 재고 로직
    }
    
    // 4. 결제 처리 (40줄)
    // ... 결제 로직
    
    // 5. 주문 생성 및 저장 (20줄)
    // ... 저장 로직
    
    // 6. 알림 발송 (30줄)
    // ... 알림 로직
    
    return order;
  }
}
```

#### 💬 리팩토링 요청
```
위 God Class를 헥사고날 아키텍처 원칙에 따라 분해해주세요:

1. **단일 책임 원칙 적용**: 각 기능을 별도 UseCase로 분리
2. **도메인 서비스 추출**: 복잡한 비즈니스 로직을 도메인으로
3. **이벤트 기반 아키텍처**: 주문 처리 과정을 이벤트로 분리
4. **포트 & 어댑터**: 외부 의존성을 포트로 추상화

각 단계별로 리팩토링 결과를 보여주세요.
```

#### ✅ 리팩토링 결과

**도메인 모델 분리:**
```typescript
// src/domain/order/entities/order.entity.ts
export class Order {
  private constructor(
    private readonly _id: OrderId,
    private readonly _customerId: CustomerId,
    private _items: OrderItem[],
    private _status: OrderStatus,
    private readonly _createdAt: Date,
  ) {}

  static create(customerId: CustomerId, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new DomainException('주문 항목이 없습니다.');
    }

    return new Order(
      OrderId.generate(),
      customerId,
      items,
      OrderStatus.PENDING,
      new Date(),
    );
  }

  calculateTotalPrice(): Money {
    return this._items.reduce(
      (total, item) => total.add(item.calculatePrice()),
      Money.zero()
    );
  }

  confirm(): void {
    if (!this._status.isPending()) {
      throw new DomainException('확정할 수 없는 주문 상태입니다.');
    }
    
    this._status = OrderStatus.CONFIRMED;
  }
}

// src/domain/order/services/pricing.domain-service.ts
@Injectable()
export class PricingDomainService {
  calculateOrderPrice(items: OrderItem[], customer: Customer): Money {
    let basePrice = items.reduce((total, item) => 
      total.add(item.calculatePrice()), Money.zero()
    );
    
    // 할인 적용 (비즈니스 로직)
    if (customer.isVip()) {
      basePrice = basePrice.applyDiscount(Percentage.of(10));
    }
    
    return basePrice;
  }
}
```

**UseCase 분리:**
```typescript
// src/application/order/use-cases/process-order.use-case.ts
@Injectable()
export class ProcessOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryPort: InventoryPort,
    private readonly paymentPort: PaymentPort,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(command: ProcessOrderCommand): Promise<ProcessOrderResult> {
    // 1. 주문 생성
    const createOrderResult = await this.createOrderUseCase.execute({
      customerId: command.customerId,
      items: command.items,
    });

    // 2. 재고 확인
    await this.checkInventoryUseCase.execute({
      orderId: createOrderResult.orderId,
      items: command.items,
    });

    // 3. 결제 처리
    await this.processPaymentUseCase.execute({
      orderId: createOrderResult.orderId,
      amount: createOrderResult.totalAmount,
    });

    // 4. 주문 확정
    const order = await this.orderRepository.findById(createOrderResult.orderId);
    order.confirm();
    await this.orderRepository.save(order);

    // 5. 이벤트 발행
    await this.eventPublisher.publish(new OrderConfirmedEvent(order.id));

    return new ProcessOrderResult(order.id.value);
  }
}

// src/application/order/use-cases/create-order.use-case.ts
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly pricingDomainService: PricingDomainService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new NotFoundException('고객을 찾을 수 없습니다.');
    }

    const orderItems = command.items.map(item => 
      OrderItem.create(item.productId, item.quantity, item.price)
    );

    const order = Order.create(customer.id, orderItems);
    const totalPrice = this.pricingDomainService.calculateOrderPrice(orderItems, customer);

    await this.orderRepository.save(order);

    return new CreateOrderResult(order.id.value, totalPrice.value);
  }
}
```

## 🔧 리팩토링 도구 활용

### 자동화된 리팩토링 검증
```
리팩토링 후 다음 검증을 수행해주세요:

1. **기능 동등성 검증**:
   - 기존 API 스펙과 동일한지 확인
   - 엣지 케이스 동작이 같은지 검증

2. **성능 영향 분석**:
   - 쿼리 실행 계획 비교
   - 응답 시간 측정

3. **테스트 커버리지**:
   - 리팩토링된 코드의 테스트 작성
   - 기존 테스트 케이스 적응

각 항목별로 검증 결과를 보고해주세요.
```

### 점진적 리팩토링 전략
```
다음 Strangler Fig 패턴으로 점진적 리팩토링을 진행해주세요:

1. **Phase 1**: 새로운 헥사고날 구조 생성 (기존 코드 유지)
2. **Phase 2**: Feature Flag로 새 구조 점진적 활성화
3. **Phase 3**: 기존 코드 단계적 제거

각 Phase별 마이그레이션 계획과 롤백 전략을 제시해주세요.
```

## 📊 리팩토링 성과 측정

### 메트릭 기반 개선 확인
```
리팩토링 전후 다음 메트릭을 비교 분석해주세요:

1. **복잡도 메트릭**:
   - Cyclomatic Complexity
   - Cognitive Complexity
   - Lines of Code per Method

2. **결합도/응집도**:
   - Afferent/Efferent Coupling
   - Lack of Cohesion of Methods (LCOM)

3. **테스트 메트릭**:
   - Test Coverage
   - Test Execution Time
   - Test Maintainability Index

구체적인 수치와 개선 정도를 보고해주세요.
```

## 💡 리팩토링 성공 팁

### ✅ 효과적인 리팩토링 요청
```
"UserService 클래스가 너무 크니까 분리해주세요" (X)

"UserService의 단일 책임 원칙 위반을 해결하기 위해 
다음과 같이 분리해주세요:
1. 사용자 생성 로직 → CreateUserUseCase
2. 프로필 업데이트 → UpdateUserProfileUseCase  
3. 비밀번호 변경 → ChangePasswordUseCase
각 UseCase는 단일 책임만 가지도록 하고,
기존 API 호환성은 유지해주세요." (O)
```

### 🚫 위험한 리팩토링 방지
- **Big Bang 리팩토링**: 한 번에 모든 것 변경
- **테스트 없는 리팩토링**: 검증 없이 코드 수정
- **성급한 최적화**: 측정 없는 성능 개선
- **과도한 추상화**: 불필요한 인터페이스 도입

---

> **핵심**: 리팩토링은 **기능을 변경하지 않으면서 코드 구조를 개선**하는 과정입니다. Claude Code와 함께 단계적이고 안전한 리팩토링을 진행하세요!