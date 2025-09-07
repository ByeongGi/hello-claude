import { shallowEqual } from 'shallow-equal-object';

export abstract class ValueObject<T> {
  private _props: T;

  constructor(props: T) {
    this.checkIfEmpty(props);
    this.validate(props);
    this._props = Object.freeze(props);
  }

  get props(): T {
    return this._props;
  }

  protected abstract validate(props: T): void;

  private checkIfEmpty(props: T): void {
    if (props === null || props === undefined) {
      throw new Error('Property cannot be null or undefined');
    }
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    return shallowEqual(this._props, vo.props);
  }
}
