import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { DeleteUserCommand } from './delete-user.command';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import { UserNotFoundError } from '../../../domain/user.errors';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  DatabaseConnectionException,
  DatabaseConstraintException,
  DatabaseException,
} from '@/application/common/exceptions/database.exception';

@CommandHandler(DeleteUserCommand)
export class DeleteUserService implements ICommandHandler<DeleteUserCommand> {
  private readonly logger = new Logger(DeleteUserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(command: DeleteUserCommand): Promise<Result<boolean, Error>> {
    try {
      const userId = UserId.create(command.id);
      const user = await this.userRepo.findById(userId);

      if (!user) {
        return Err(new UserNotFoundError(command.id));
      }

      await this.userRepo.delete(command.id);
      this.logger.log(`User deleted successfully: ${command.id}`);

      return Ok(true);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete user: ${error.message}`,
        error.stack,
        { userId: command.id },
      );

      if (error instanceof UserNotFoundError) {
        return Err(error);
      }

      if (error.code === '23503') {
        return Err(
          new DatabaseConstraintException(
            'Cannot delete user due to related records',
            'foreign_key_constraint',
            error.message,
          ),
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return Err(
          new DatabaseConnectionException(
            'Unable to delete user due to database connection issue',
            error.message,
          ),
        );
      }

      return Err(
        new DatabaseException(
          'Failed to delete user due to a database error',
          500,
          'DELETE_USER_ERROR',
          error.message,
        ),
      );
    }
  }
}
