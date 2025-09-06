import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './interfaces/user-repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { DatabaseRetry } from '@/application/common/decorators/database-retry.decorator';
import {
  DatabaseException,
  DatabaseConnectionException,
  DatabaseTimeoutException,
  DatabaseConstraintException,
} from '@/application/common/exceptions/database.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @DatabaseRetry({ maxAttempts: 3, delayMs: 1000 })
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.userRepository.findByEmail(
        createUserDto.email,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = await this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      this.logger.log(`User created successfully: ${user.id}`);
      return plainToInstance(UserResponseDto, user);
    } catch (error: any) {
      this.logger.error(
        `Failed to create user: ${error.message}`,
        error.stack,
        { email: createUserDto.email },
      );

      if (error instanceof ConflictException) {
        throw error;
      }

      // TypeORM 에러를 적절한 DB 예외로 변환
      if (error.code === '23505') {
        // Unique constraint violation
        throw new DatabaseConstraintException(
          'User with this email already exists',
          'unique_email_constraint',
          error.message,
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new DatabaseConnectionException(
          'Unable to create user due to database connection issue',
          error.message,
        );
      }

      throw new DatabaseException(
        'Failed to create user due to database error',
        500,
        'CREATE_USER_ERROR',
        error.message,
      );
    }
  }

  @DatabaseRetry({ maxAttempts: 2, delayMs: 500 })
  async findAll(query: QueryUsersDto): Promise<{
    users: UserResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { users, total } = await this.userRepository.findMany(query);
      const totalPages = Math.ceil(total / query.limit);

      this.logger.debug(`Retrieved ${users.length} users from database`);
      return {
        users: plainToInstance(UserResponseDto, users),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve users: ${error.message}`,
        error.stack,
        { query },
      );

      if (error.code === '57014') {
        // Query timeout
        throw new DatabaseTimeoutException(
          'User search query took too long to execute',
          30000,
          error.message,
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new DatabaseConnectionException(
          'Unable to retrieve users due to database connection issue',
          error.message,
        );
      }

      throw new DatabaseException(
        'Failed to retrieve users due to database error',
        500,
        'FIND_USERS_ERROR',
        error.message,
      );
    }
  }

  @DatabaseRetry({ maxAttempts: 2, delayMs: 500 })
  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return plainToInstance(UserResponseDto, user);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to find user by ID: ${error.message}`,
        error.stack,
        { userId: id },
      );

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new DatabaseConnectionException(
          'Unable to find user due to database connection issue',
          error.message,
        );
      }

      throw new DatabaseException(
        'Failed to find user due to database error',
        500,
        'FIND_USER_ERROR',
        error.message,
      );
    }
  }

  @DatabaseRetry({ maxAttempts: 3, delayMs: 1000 })
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findByEmail(
          updateUserDto.email,
        );
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      const updateData: any = { ...updateUserDto };

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 12);
      }

      const updatedUser = await this.userRepository.update(id, updateData);
      this.logger.log(`User updated successfully: ${id}`);
      return plainToInstance(UserResponseDto, updatedUser);
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update user: ${error.message}`,
        error.stack,
        { userId: id, updateData: updateUserDto },
      );

      if (error.code === '23505') {
        // Unique constraint violation
        throw new DatabaseConstraintException(
          'User with this email already exists',
          'unique_email_constraint',
          error.message,
        );
      }

      if (error.code === '40P01') {
        // Deadlock
        throw new DatabaseException(
          'Update failed due to database conflict, please retry',
          409,
          'DEADLOCK_ERROR',
          error.message,
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new DatabaseConnectionException(
          'Unable to update user due to database connection issue',
          error.message,
        );
      }

      throw new DatabaseException(
        'Failed to update user due to database error',
        500,
        'UPDATE_USER_ERROR',
        error.message,
      );
    }
  }

  @DatabaseRetry({ maxAttempts: 2, delayMs: 1000 })
  async remove(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userRepository.delete(id);
      this.logger.log(`User deleted successfully: ${id}`);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to delete user: ${error.message}`,
        error.stack,
        { userId: id },
      );

      if (error.code === '23503') {
        // Foreign key constraint violation
        throw new DatabaseConstraintException(
          'Cannot delete user due to related records',
          'foreign_key_constraint',
          error.message,
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new DatabaseConnectionException(
          'Unable to delete user due to database connection issue',
          error.message,
        );
      }

      throw new DatabaseException(
        'Failed to delete user due to database error',
        500,
        'DELETE_USER_ERROR',
        error.message,
      );
    }
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    return plainToInstance(UserResponseDto, user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return plainToInstance(UserResponseDto, user);
  }
}
