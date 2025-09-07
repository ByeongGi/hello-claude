import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<Props> {
  private _domainEvents: DomainEvent[] = [];
  private _id: string;
  private _props: Props;

  constructor(props: Props, id: string) {
    this._props = props;
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  get props(): Props {
    return this._props;
  }

  protected addEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  protected abstract validate(): void;

  public getProps(): Props {
    const propsCopy = JSON.parse(JSON.stringify(this._props));
    return propsCopy;
  }
}
