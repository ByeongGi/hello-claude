import { DomainEvent, DomainEventProps } from '@/libs/ddd';

export class UserCreatedDomainEvent extends DomainEvent {
  readonly userId: string;
  readonly email: string;

  constructor(props: DomainEventProps<UserCreatedDomainEvent>) {
    super(props);
    this.userId = props.userId;
    this.email = props.email;
  }
}
