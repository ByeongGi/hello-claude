import { AggregateRoot } from './aggregate-root';

export interface RepositoryPort<Entity extends AggregateRoot<unknown>> {
  save(entity: Entity): Promise<void>;
  findById(id: string): Promise<Entity | null>;
  delete(id: string): Promise<void>;
}
