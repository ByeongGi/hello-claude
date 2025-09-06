import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '@/application/users/users.service';
import { CreateUserDto } from '@/application/users/dto/create-user.dto';
import { UpdateUserDto } from '@/application/users/dto/update-user.dto';
import { QueryUsersDto } from '@/application/users/dto/query-users.dto';
import { UserResponseDto } from '@/application/users/dto/user-response.dto';
import { UserRole } from '@/domain/users/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserResponse: UserResponseDto = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
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
      usersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle service errors', async () => {
      usersService.create.mockRejectedValue(new Error('Service error'));

      await expect(controller.create(createUserDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryUsersDto = {
      page: 1,
      limit: 10,
      search: 'john',
      role: UserRole.USER,
      isActive: true,
    };

    const mockResponse = {
      users: [mockUserResponse],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should return paginated users', async () => {
      usersService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(queryDto);

      expect(usersService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty results', async () => {
      const emptyResponse = {
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
      usersService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(emptyResponse);
      expect(result.users).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    const userId = '1';

    it('should return a user by id', async () => {
      usersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle service errors', async () => {
      usersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(controller.findOne(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('update', () => {
    const userId = '1';
    const updateUserDto: UpdateUserDto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUserResponse, name: 'Jane Doe' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should handle service errors', async () => {
      usersService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('remove', () => {
    const userId = '1';

    it('should delete a user successfully', async () => {
      usersService.remove.mockResolvedValue();

      await controller.remove(userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should handle service errors', async () => {
      usersService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(userId)).rejects.toThrow('Delete failed');
    });
  });
});
