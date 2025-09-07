import { ValueObject } from '@/libs/ddd/value-object';
import { randomUUID } from 'crypto';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  static generate(): UserId {
    return new UserId({ value: randomUUID() });
  }

  static create(id: string): UserId {
    return new UserId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  protected validate(props: UserIdProps): void {
    if (!props.value) {
      throw new Error('UserId cannot be empty');
    }
  }
}
