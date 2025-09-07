import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { UserRepositoryPort } from './user.repository.port';
import { UserEntity } from '../domain/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from '../user.mapper';
import { Email } from '../domain/value-objects/email.value-object';
import { UserId } from '../domain/value-objects/user-id.value-object';
import { FindUsersQuery } from '../application/queries/find-users/find-users.query';
import { UserResponseDto } from '../dtos/user.response.dto';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepo: Repository<UserOrmEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async save(entity: UserEntity): Promise<void> {
    const ormEntity = this.mapper.toPersistence(entity);
    await this.userOrmRepo.save(ormEntity);
  }

  async findByEmail(email: Email): Promise<UserEntity | null> {
    const ormEntity = await this.userOrmRepo.findOne({
      where: { email: email.value },
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findById(id: UserId): Promise<UserEntity | null> {
    const ormEntity = await this.userOrmRepo.findOne({
      where: { id: id.value },
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.userOrmRepo.count({
      where: { email: email.value },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.userOrmRepo.delete(id);
  }

  async findMany(
    query: FindUsersQuery,
  ): Promise<{ users: UserResponseDto[]; total: number }> {
    const { page = 1, limit = 10, search } = query;

    const where: FindManyOptions<UserOrmEntity>['where'] = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : {};

    const [ormEntities, total] = await this.userOrmRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    const users = ormEntities.map((entity) => new UserResponseDto(entity));

    return { users, total };
  }
}
