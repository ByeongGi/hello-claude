import { RepositoryPort } from '@/libs/ddd';
import { UserEntity } from '../domain/user.entity';
import { Email } from '../domain/value-objects/email.value-object';
import { UserId } from '../domain/value-objects/user-id.value-object';
import { FindUsersQuery } from '../application/queries/find-users/find-users.query';
import { UserResponseDto } from '../dtos/user.response.dto';

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findByEmail(email: Email): Promise<UserEntity | null>;
  findById(id: UserId): Promise<UserEntity | null>;
  existsByEmail(email: Email): Promise<boolean>;
  findMany(
    query: FindUsersQuery,
  ): Promise<{ users: UserResponseDto[]; total: number }>;
}
