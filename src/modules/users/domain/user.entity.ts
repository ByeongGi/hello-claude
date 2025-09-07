import { AggregateRoot } from '@/libs/ddd';
import { UserCreatedDomainEvent } from './events/user-created.domain-event';
import { Email } from './value-objects/email.value-object';
import { UserId } from './value-objects/user-id.value-object';

export interface CreateUserProps {
  email: Email;
  name: string;
  password?: string;
}

export interface UserProps extends CreateUserProps {
  id: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity extends AggregateRoot<UserProps> {
  protected readonly _id: UserId;

  constructor(props: UserProps) {
    super(props, props.id.value);
    this._id = props.id;
  }

  static create(create: CreateUserProps): UserEntity {
    const id = UserId.generate();
    const props: UserProps = {
      ...create,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = new UserEntity(props);

    user.addEvent(
      new UserCreatedDomainEvent({
        aggregateId: id.value,
        userId: id.value,
        email: create.email.value,
      }),
    );

    return user;
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get password(): string | undefined {
    return this.props.password;
  }

  updateName(newName: string): void {
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }

  updateEmail(newEmail: Email): void {
    this.props.email = newEmail;
    this.props.updatedAt = new Date();
  }

  updatePassword(newPassword: string): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  canCreateOrder(): boolean {
    return this.email.isVerified && this.name.length > 0;
  }

  protected validate(): void {
    if (!this.props.email) {
      throw new Error('User email is required');
    }
    if (!this.props.name || this.props.name.length < 2) {
      throw new Error('User name must be at least 2 characters');
    }
  }
}
