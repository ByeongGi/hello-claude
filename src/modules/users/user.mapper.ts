import { Injectable } from '@nestjs/common';
import { UserEntity } from './domain/user.entity';
import { UserOrmEntity } from './database/user.orm-entity';
import { UserResponseDto } from './dtos/user.response.dto';
import { Email } from './domain/value-objects/email.value-object';
import { UserId } from './domain/value-objects/user-id.value-object';

@Injectable()
export class UserMapper {
  toDomain(ormEntity: UserOrmEntity): UserEntity {
    const entityProps = {
      id: UserId.create(ormEntity.id),
      email: Email.create(ormEntity.email),
      name: ormEntity.name,
      password: ormEntity.password,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    };

    return new UserEntity(entityProps, entityProps.id.value);
  }

  toPersistence(entity: UserEntity): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = entity.id.value;
    ormEntity.email = entity.email.value;
    ormEntity.name = entity.name;
    ormEntity.password = entity.password;
    ormEntity.createdAt = entity.getProps().createdAt;
    ormEntity.updatedAt = entity.getProps().updatedAt;
    return ormEntity;
  }

  toResponse(entity: UserEntity): UserResponseDto {
    return new UserResponseDto({
      id: entity.id.value,
      email: entity.email.value,
      name: entity.name,
      createdAt: entity.getProps().createdAt.toISOString(),
    });
  }
}
