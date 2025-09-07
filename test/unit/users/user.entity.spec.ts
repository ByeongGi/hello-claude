import { UserEntity } from '@/modules/users/domain/user.entity';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { UserId } from '@/modules/users/domain/value-objects/user-id.value-object';

describe('UserEntity', () => {
  const validEmail = Email.create('test@example.com');
  const validName = 'Test User';
  const validPassword = 'hashedPassword123';

  describe('create', () => {
    it('should create a user entity with valid data', () => {
      const userData = {
        email: validEmail,
        name: validName,
        password: validPassword,
      };

      const user = UserEntity.create(userData);

      expect(user).toBeInstanceOf(UserEntity);
      expect(user.email.value).toBe('test@example.com');
      expect(user.name).toBe(validName);
      expect(user.password).toBe(validPassword);
      expect(user.userId).toBeInstanceOf(UserId);
    });

    it('should create user with only required fields', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };

      const user = UserEntity.create(userData);

      expect(user).toBeInstanceOf(UserEntity);
      expect(user.email.value).toBe('test@example.com');
      expect(user.name).toBe(validName);
      expect(user.password).toBeUndefined();
    });

    it('should generate unique user IDs', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };

      const user1 = UserEntity.create(userData);
      const user2 = UserEntity.create(userData);

      expect(user1.userId.value).not.toBe(user2.userId.value);
    });

    it('should create user successfully', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };

      const user = UserEntity.create(userData);

      expect(user).toBeDefined();
      expect(user.userId).toBeDefined();
    });

    it('should validate during creation', () => {
      const validUserData = {
        email: validEmail,
        name: validName,
      };
      
      expect(() => UserEntity.create(validUserData)).not.toThrow();
    });
  });

  describe('update methods', () => {
    let user: UserEntity;

    beforeEach(() => {
      const userData = {
        email: validEmail,
        name: validName,
        password: validPassword,
      };
      
      user = UserEntity.create(userData);
    });

    it('should update user name successfully', () => {
      const newName = 'Updated Name';
      user.updateName(newName);

      expect(user.name).toBe(newName);
    });

    it('should update user email successfully', () => {
      const newEmail = Email.create('newemail@example.com');
      user.updateEmail(newEmail);

      expect(user.email.value).toBe('newemail@example.com');
    });

    it('should update user password successfully', () => {
      const newPassword = 'newHashedPassword';
      user.updatePassword(newPassword);

      expect(user.password).toBe(newPassword);
    });
  });

  describe('canCreateOrder', () => {
    it('should return true for verified user with valid name', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };
      
      const user = UserEntity.create(userData);
      
      expect(user.canCreateOrder()).toBe(true);
    });

    it('should return true for valid user', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };
      
      const user = UserEntity.create(userData);
      expect(user.canCreateOrder()).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate user with proper email and name', () => {
      const userData = {
        email: validEmail,
        name: validName,
      };
      
      const user = UserEntity.create(userData);
      
      // validate() is called during creation, so if no error thrown, it's valid
      expect(user).toBeDefined();
    });
  });

  describe('getters', () => {
    it('should return correct email', () => {
      const user = UserEntity.create({
        email: validEmail,
        name: validName,
      });

      expect(user.email).toBe(validEmail);
      expect(user.email.value).toBe('test@example.com');
    });

    it('should return correct name', () => {
      const user = UserEntity.create({
        email: validEmail,
        name: validName,
      });

      expect(user.name).toBe(validName);
    });

    it('should return correct password when provided', () => {
      const user = UserEntity.create({
        email: validEmail,
        name: validName,
        password: validPassword,
      });

      expect(user.password).toBe(validPassword);
    });

    it('should return undefined password when not provided', () => {
      const user = UserEntity.create({
        email: validEmail,
        name: validName,
      });

      expect(user.password).toBeUndefined();
    });

    it('should return userId', () => {
      const user = UserEntity.create({
        email: validEmail,
        name: validName,
      });

      expect(user.userId).toBeInstanceOf(UserId);
      expect(typeof user.userId.value).toBe('string');
    });
  });
});