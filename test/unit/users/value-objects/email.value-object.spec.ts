import { Email } from '@/modules/users/domain/value-objects/email.value-object';

describe('Email', () => {
  describe('create', () => {
    it('should create email with valid format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@subdomain.example.org',
        'test123@gmail.com',
      ];

      validEmails.forEach((email) => {
        const emailVO = Email.create(email);
        
        expect(emailVO).toBeInstanceOf(Email);
        expect(emailVO.value).toBe(email.toLowerCase().trim());
      });
    });

    it('should fail to create email with invalid format', () => {
      const invalidEmails = [
        'invalid-email',
        'test.example.com',
        '',
        ' ',
      ];

      invalidEmails.forEach((email) => {
        expect(() => Email.create(email)).toThrow();
      });
    });

    it('should normalize email to lowercase', () => {
      const email = 'Test.User@EXAMPLE.COM';
      const emailVO = Email.create(email);

      expect(emailVO.value).toBe('test.user@example.com');
    });

    it('should trim whitespace from email', () => {
      const email = '  test@example.com  ';
      const emailVO = Email.create(email);

      expect(emailVO.value).toBe('test@example.com');
    });
  });

  describe('isVerified', () => {
    it('should return verification status', () => {
      const email = Email.create('test@example.com');
      
      expect(typeof email.isVerified).toBe('boolean');
    });
  });

  describe('equals', () => {
    it('should return true for same email values', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different cases', () => {
      const email1 = Email.create('Test@Example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email values', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });
});