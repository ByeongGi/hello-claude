import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { IUserRepository } from './interfaces/user-repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, User } from '@/domain/users/user.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should create a user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Jane Doe',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(userRepository.update).toHaveBeenCalledWith('1', updateUserDto);
      expect(result.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.update('1', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue(undefined);

      await service.remove('1');

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(userRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(userRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'john@example.com',
        'password123',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
      expect(result).toBeDefined();
      expect(result.email).toBe('john@example.com');
    });

    it('should return null when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'john@example.com',
        'password123',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'john@example.com',
        'wrongPassword',
      );

      expect(result).toBeNull();
    });
  });
});
