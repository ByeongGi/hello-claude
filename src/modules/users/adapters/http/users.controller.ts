import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Result, match } from 'oxide.ts';

// Local DTOs and Commands
import { CreateUserRequestDto } from './dtos/create-user.request.dto';
import { UpdateUserRequestDto } from './dtos/update-user.request.dto';
import { UserQueryDto } from './dtos/user.query.dto';
import { UserResponseDto } from './dtos/user.response.dto';
import { IdResponse } from './dtos/id.response.dto';
import { CreateUserCommand } from './application/commands/create-user/create-user.command';
import { UpdateUserCommand } from './application/commands/update-user/update-user.command';
import { DeleteUserCommand } from './application/commands/delete-user/delete-user.command';
import { FindUsersQuery } from './application/queries/find-users/find-users.query';
import { FindUserByIdQuery } from './application/queries/find-user-by-id/find-user-by-id.query';

// Domain Errors
import {
  UserAlreadyExistsError,
  UserNotFoundError,
} from './domain/user.errors';

// Common DTOs
import { PaginatedResponseDto } from '@/application/common/dto/pagination-response.dto';
import {
  DatabaseConnectionException,
  DatabaseConstraintException,
  DatabaseDeadlockException,
} from '@/application/common/exceptions/database.exception';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: IdResponse })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists',
  })
  async create(@Body() request: CreateUserRequestDto): Promise<IdResponse> {
    const command = new CreateUserCommand(request);
    const result: Result<string, Error> =
      await this.commandBus.execute(command);

    return match(result, {
      Ok: (id: string) => new IdResponse(id),
      Err: (error: Error) => {
        if (error instanceof UserAlreadyExistsError) {
          throw new ConflictException(error.message);
        }
        if (error instanceof DatabaseConstraintException) {
          throw new ConflictException(error.message);
        }
        if (error instanceof DatabaseConnectionException) {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Failed to create user');
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedResponseDto<UserResponseDto>,
  })
  async findAll(
    @Query() queryDto: UserQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const query = new FindUsersQuery(queryDto);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const query = new FindUserByIdQuery({ id });
    const result: Result<UserResponseDto, UserNotFoundError> =
      await this.queryBus.execute(query);

    return match(result, {
      Ok: (user: UserResponseDto) => user,
      Err: (error: UserNotFoundError) => {
        throw new NotFoundException(error.message);
      },
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdateUserRequestDto,
  ): Promise<void> {
    const command = new UpdateUserCommand({ id, ...request });
    const result: Result<boolean, Error> =
      await this.commandBus.execute(command);

    match(result, {
      Ok: () => {
        /* Do nothing, success */
      },
      Err: (error: Error) => {
        if (error instanceof UserNotFoundError) {
          throw new NotFoundException(error.message);
        }
        if (error instanceof UserAlreadyExistsError) {
          throw new ConflictException(error.message);
        }
        if (error instanceof DatabaseConstraintException) {
          throw new ConflictException(error.message);
        }
        if (error instanceof DatabaseDeadlockException) {
          throw new ConflictException(error.message); // Or a retry mechanism
        }
        if (error instanceof DatabaseConnectionException) {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Failed to update user');
      },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const command = new DeleteUserCommand({ id });
    const result: Result<boolean, Error> =
      await this.commandBus.execute(command);

    match(result, {
      Ok: () => {
        /* Do nothing, success */
      },
      Err: (error: Error) => {
        if (error instanceof UserNotFoundError) {
          throw new NotFoundException(error.message);
        }
        if (error instanceof DatabaseConstraintException) {
          throw new ConflictException(error.message);
        }
        if (error instanceof DatabaseConnectionException) {
          throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('Failed to delete user');
      },
    });
  }
}
