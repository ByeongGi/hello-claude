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

    return new UserEntity(entityProps);
  }

  toPersistence(entity: UserEntity): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = entity.userId.value;
    ormEntity.email = entity.email.value;
    ormEntity.name = entity.name;
    ormEntity.password = entity.password;
    ormEntity.createdAt = entity.props.createdAt;
    ormEntity.updatedAt = entity.props.updatedAt;
    return ormEntity;
  }

  toResponse(entity: UserEntity): UserResponseDto {
    return new UserResponseDto({
      id: entity.userId.value,
      email: entity.email.value,
      name: entity.name,
      createdAt: entity.props.createdAt.toISOString(),
    });
  }
}
