import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { UserRepository } from './database/user.repository';
import { UserOrmEntity } from './database/user.orm-entity';
import { UsersController } from './users.controller';

// Application
import { CreateUserService } from './application/commands/create-user/create-user.service';
import { UpdateUserService } from './application/commands/update-user/update-user.service';
import { DeleteUserService } from './application/commands/delete-user/delete-user.service';
import { FindUsersHandler } from './application/queries/find-users/find-users.handler';
import { FindUserByIdHandler } from './application/queries/find-user-by-id/find-user-by-id.handler';
import { ValidateUserHandler } from './application/queries/validate-user/validate-user.handler';

// Domain
import { UserMapper } from './user.mapper';
import { USER_REPOSITORY } from './user.tokens';

const commandHandlers = [
  CreateUserService,
  UpdateUserService,
  DeleteUserService,
];

const queryHandlers = [
  FindUsersHandler,
  FindUserByIdHandler,
  ValidateUserHandler,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    UserMapper,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class UserModule {}
