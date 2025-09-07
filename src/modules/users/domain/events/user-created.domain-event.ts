import { DomainEvent, DomainEventProps } from '@/libs/ddd/domain-event';

interface UserCreatedEventProps {
  aggregateId: string;
  userId: string;
  email: string;
}

export class UserCreatedDomainEvent extends DomainEvent {
  readonly userId: string;
  readonly email: string;
  readonly aggregateId: string;

  constructor(props: UserCreatedEventProps) {
    super();
    this.aggregateId = props.aggregateId;
    this.userId = props.userId;
    this.email = props.email;
  }
}
