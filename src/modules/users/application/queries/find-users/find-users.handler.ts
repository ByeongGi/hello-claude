import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { FindUsersQuery } from './find-users.query';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import { UserResponseDto } from '../../../dtos/user.response.dto';
import { PaginatedResponseDto } from '@/application/common/dto/pagination-response.dto';
import {
  DatabaseTimeoutException,
  DatabaseConnectionException,
  DatabaseException,
} from '@/application/common/exceptions/database.exception';

@QueryHandler(FindUsersQuery)
export class FindUsersHandler implements IQueryHandler<FindUsersQuery> {
  private readonly logger = new Logger(FindUsersHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(
    query: FindUsersQuery,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    try {
      const { users, total } = await this.userRepo.findMany(query);
      const totalPages = Math.ceil(total / query.limit);

      this.logger.debug(`Retrieved ${users.length} users from database`);

      return new PaginatedResponseDto(users, {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      });
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
        'Failed to retrieve users due to a database error',
        500,
        'FIND_USERS_ERROR',
        error.message,
      );
    }
  }
}
