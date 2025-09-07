import { ValueObject } from '@/libs/ddd/value-object';

// Test implementation for ValueObject
interface TestValueProps {
  value: string;
}

class TestValue extends ValueObject<TestValueProps> {
  static create(value: string): TestValue {
    return new TestValue({ value });
  }

  get value(): string {
    return this.props.value;
  }

  protected validate(props: TestValueProps): void {
    if (!props.value) {
      throw new Error('Value cannot be empty');
    }
  }
}

describe('ValueObject', () => {
  describe('create and validation', () => {
    it('should create value object with valid props', () => {
      const testValue = TestValue.create('test');

      expect(testValue).toBeInstanceOf(TestValue);
      expect(testValue.value).toBe('test');
    });

    it('should validate props during creation', () => {
      expect(() => TestValue.create('')).toThrow('Value cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for same values', () => {
      const value1 = TestValue.create('test');
      const value2 = TestValue.create('test');

      expect(value1.equals(value2)).toBe(true);
    });

    it('should return false for different values', () => {
      const value1 = TestValue.create('test1');
      const value2 = TestValue.create('test2');

      expect(value1.equals(value2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const value = TestValue.create('test');

      expect(value.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with different type', () => {
      const value = TestValue.create('test');

      expect(value.equals('test' as any)).toBe(false);
      expect(value.equals({} as any)).toBe(false);
    });
  });
});