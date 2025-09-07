import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import * as bcrypt from 'bcrypt';
import { UpdateUserCommand } from './update-user.command';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import {
  UserNotFoundError,
  UserAlreadyExistsError,
} from '../../../domain/user.errors';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  DatabaseConnectionException,
  DatabaseConstraintException,
  DatabaseException,
  DatabaseDeadlockException,
} from '@/libs/exceptions/database.exception';

@CommandHandler(UpdateUserCommand)
export class UpdateUserService implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Result<boolean, Error>> {
    try {
      const userId = UserId.create(command.id);
      const user = await this.userRepo.findById(userId);

      if (!user) {
        return Err(new UserNotFoundError());
      }

      if (command.email) {
        const newEmail = Email.create(command.email);
        if (!user.email.equals(newEmail)) {
          const existingUser = await this.userRepo.findByEmail(newEmail);
          if (existingUser && !existingUser.userId.equals(user.userId)) {
            return Err(new UserAlreadyExistsError(newEmail.value));
          }
          user.updateEmail(newEmail);
        }
      }

      if (command.name) {
        user.updateName(command.name);
      }

      if (command.password) {
        const hashedPassword = await bcrypt.hash(command.password, 12);
        user.updatePassword(hashedPassword);
      }

      await this.userRepo.save(user);
      this.logger.log(`User updated successfully: ${command.id}`);

      return Ok(true);
    } catch (error: any) {
      this.logger.error(
        `Failed to update user: ${error.message}`,
        error.stack,
        { userId: command.id, updateData: command },
      );

      if (
        error instanceof UserNotFoundError ||
        error instanceof UserAlreadyExistsError
      ) {
        return Err(error);
      }

      if (error.code === '23505') {
        return Err(
          new DatabaseConstraintException(
            'User with this email already exists',
            'unique_email_constraint',
            error.message,
          ),
        );
      }

      if (error.code === '40P01') {
        return Err(
          new DatabaseDeadlockException(
            'Update failed due to database conflict, please retry',
            error.message,
          ),
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return Err(
          new DatabaseConnectionException(
            'Unable to update user due to database connection issue',
            error.message,
          ),
        );
      }

      return Err(
        new DatabaseException(
          'Failed to update user due to a database error',
          500,
          'UPDATE_USER_ERROR',
          error.message,
        ),
      );
    }
  }
}
