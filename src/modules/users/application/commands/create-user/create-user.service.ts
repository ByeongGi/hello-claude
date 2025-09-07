import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import * as bcrypt from 'bcrypt';
import { CreateUserCommand } from './create-user.command';
import { UserEntity } from '../../../domain/user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import { UserAlreadyExistsError } from '../../../domain/user.errors';
import {
  DatabaseConnectionException,
  DatabaseConstraintException,
  DatabaseException,
} from '@/application/common/exceptions/database.exception';

@CommandHandler(CreateUserCommand)
export class CreateUserService implements ICommandHandler<CreateUserCommand> {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<string, Error>> {
    try {
      const email = Email.create(command.email);

      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        return Err(new UserAlreadyExistsError(email.value));
      }

      const hashedPassword = command.password
        ? await bcrypt.hash(command.password, 12)
        : undefined;

      const user = UserEntity.create({
        email,
        name: command.name,
        password: hashedPassword,
      });

      await this.userRepo.save(user);
      this.logger.log(`User created successfully: ${user.userId.value}`);

      return Ok(user.userId.value);
    } catch (error: any) {
      this.logger.error(
        `Failed to create user: ${error.message}`,
        error.stack,
        { email: command.email },
      );

      if (error instanceof UserAlreadyExistsError) {
        return Err(error);
      }

      // Handle specific database errors, similar to the old service
      if (error.code === '23505') {
        // Unique constraint violation
        return Err(
          new DatabaseConstraintException(
            'User with this email already exists',
            'unique_email_constraint',
            error.message,
          ),
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return Err(
          new DatabaseConnectionException(
            'Unable to create user due to database connection issue',
            error.message,
          ),
        );
      }

      // Generic database error
      return Err(
        new DatabaseException(
          'Failed to create user due to a database error',
          500,
          'CREATE_USER_ERROR',
          error.message,
        ),
      );
    }
  }
}
