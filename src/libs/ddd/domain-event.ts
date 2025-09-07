import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly id: string;

  constructor() {
    this.id = randomUUID();
    this.occurredOn = new Date();
  }
}

export interface DomainEventProps {
  aggregateId: string;
  [key: string]: any;
}
