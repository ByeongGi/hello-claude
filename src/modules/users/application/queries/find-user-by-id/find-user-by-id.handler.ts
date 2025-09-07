import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { FindUserByIdQuery } from './find-user-by-id.query';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import { UserResponseDto } from '../../../dtos/user.response.dto';
import { UserNotFoundError } from '../../../domain/user.errors';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { UserMapper } from '../../../user.mapper';
import { Err, Ok, Result } from 'oxide.ts';

@QueryHandler(FindUserByIdQuery)
export class FindUserByIdHandler implements IQueryHandler<FindUserByIdQuery> {
  private readonly logger = new Logger(FindUserByIdHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    private readonly mapper: UserMapper,
  ) {}

  async execute(
    query: FindUserByIdQuery,
  ): Promise<Result<UserResponseDto, UserNotFoundError>> {
    try {
      const userId = UserId.create(query.id);
      const user = await this.userRepo.findById(userId);

      if (!user) {
        return Err(new UserNotFoundError(query.id));
      }

      const responseDto = this.mapper.toResponse(user);
      return Ok(responseDto);
    } catch (error: any) {
      this.logger.error(
        `Failed to find user by ID: ${error.message}`,
        error.stack,
        { userId: query.id },
      );
      // Re-throw or handle as a specific application error
      if (error instanceof UserNotFoundError) {
        return Err(error);
      }
      // For other errors, you might want to return a more generic error
      return Err(new UserNotFoundError(query.id)); // Simplified for now
    }
  }
}
