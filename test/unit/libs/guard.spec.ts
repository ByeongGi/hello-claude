import { Guard } from '@/libs/guard';

describe('Guard', () => {
  describe('againstNullOrUndefined', () => {
    it('should not throw for valid values', () => {
      expect(() => Guard.againstNullOrUndefined('valid', 'test')).not.toThrow();
      expect(() => Guard.againstNullOrUndefined(0, 'test')).not.toThrow();
      expect(() => Guard.againstNullOrUndefined(false, 'test')).not.toThrow();
      expect(() => Guard.againstNullOrUndefined('', 'test')).not.toThrow();
      expect(() => Guard.againstNullOrUndefined([], 'test')).not.toThrow();
      expect(() => Guard.againstNullOrUndefined({}, 'test')).not.toThrow();
    });

    it('should throw error for null value', () => {
      expect(() => Guard.againstNullOrUndefined(null, 'testField'))
        .toThrow('testField cannot be null or undefined');
    });

    it('should throw error for undefined value', () => {
      expect(() => Guard.againstNullOrUndefined(undefined, 'testField'))
        .toThrow('testField cannot be null or undefined');
    });

    it('should include field name in error message', () => {
      expect(() => Guard.againstNullOrUndefined(null, 'email'))
        .toThrow('email cannot be null or undefined');
      
      expect(() => Guard.againstNullOrUndefined(undefined, 'password'))
        .toThrow('password cannot be null or undefined');
    });
  });

  describe('againstInvalidEmail', () => {
    it('should not throw for valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@subdomain.example.org',
        'test123@gmail.com',
        'a@b.co',
        'test@example-domain.com',
      ];

      validEmails.forEach(email => {
        expect(() => Guard.againstInvalidEmail(email)).not.toThrow();
      });
    });

    it('should throw error for emails without @ symbol', () => {
      const invalidEmails = [
        'invalid-email',
        'test.example.com',
        'testexample.com',
        'test',
      ];

      invalidEmails.forEach(email => {
        expect(() => Guard.againstInvalidEmail(email))
          .toThrow('Invalid email format');
      });
    });

    it('should throw error for empty string', () => {
      expect(() => Guard.againstInvalidEmail(''))
        .toThrow('Invalid email format');
    });

    it('should throw error for string with spaces', () => {
      expect(() => Guard.againstInvalidEmail('   '))
        .toThrow('Invalid email format');
    });

    it('should handle edge cases', () => {
      // Edge cases that still have @
      expect(() => Guard.againstInvalidEmail('test@')).not.toThrow();
      expect(() => Guard.againstInvalidEmail('@example.com')).not.toThrow();
      expect(() => Guard.againstInvalidEmail('a@b')).not.toThrow();
    });
  });
});