import { UserId } from '@/modules/users/domain/value-objects/user-id.value-object';

describe('UserId', () => {
  describe('create', () => {
    it('should create user id with valid UUID', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUUIDs.forEach((id) => {
        const userIdVO = UserId.create(id);
        
        expect(userIdVO).toBeInstanceOf(UserId);
        expect(userIdVO.value).toBe(id);
      });
    });

    it('should create user id with any valid string', () => {
      const validIds = [
        'user-123',
        'abc123',
        '12345',
      ];

      validIds.forEach((id) => {
        const userIdVO = UserId.create(id);
        
        expect(userIdVO).toBeInstanceOf(UserId);
        expect(userIdVO.value).toBe(id);
      });
    });

    it('should fail to create user id with empty string', () => {
      expect(() => UserId.create('')).toThrow('UserId cannot be empty');
    });

    it('should generate new unique user id', () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();

      expect(id1).toBeInstanceOf(UserId);
      expect(id2).toBeInstanceOf(UserId);
      expect(id1.value).not.toBe(id2.value);
      expect(id1.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('equals', () => {
    it('should return true for same user id values', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const id1 = UserId.create(id);
      const id2 = UserId.create(id);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different user id values', () => {
      const id1 = UserId.create('123e4567-e89b-12d3-a456-426614174000');
      const id2 = UserId.create('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      expect(id1.equals(id2)).toBe(false);
    });

  });

  describe('value property', () => {
    it('should return string representation of user id', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userIdVO = UserId.create(id);

      expect(userIdVO.value).toBe(id);
      expect(typeof userIdVO.value).toBe('string');
    });
  });

  describe('static methods', () => {
    it('should create from existing id', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userIdVO = UserId.create(id);

      expect(userIdVO).toBeInstanceOf(UserId);
      expect(userIdVO.value).toBe(id);
    });

    it('should generate multiple unique ids', () => {
      const ids = new Set();
      const count = 10;

      for (let i = 0; i < count; i++) {
        const userIdVO = UserId.generate();
        ids.add(userIdVO.value);
      }

      expect(ids.size).toBe(count); // All should be unique
    });
  });
});