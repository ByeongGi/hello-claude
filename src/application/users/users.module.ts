import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from '@/infrastructure/users/users.controller';
import { UserRepository } from '@/infrastructure/users/user.repository';
import { User } from '@/domain/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    {
      provide: 'IUserRepository',
      useExisting: UserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
