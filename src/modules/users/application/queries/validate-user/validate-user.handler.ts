import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ValidateUserQuery } from './validate-user.query';
import { UserRepositoryPort } from '../../../database/user.repository.port';
import { USER_REPOSITORY } from '../../../user.tokens';
import { UserEntity } from '../../../domain/user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { Ok, Err, Result } from 'oxide.ts';

@QueryHandler(ValidateUserQuery)
export class ValidateUserHandler implements IQueryHandler<ValidateUserQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(query: ValidateUserQuery): Promise<Result<UserEntity, Error>> {
    try {
      const email = Email.create(query.email);
      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return Err(new Error('User not found'));
      }

      const passwordMatch = await bcrypt.compare(query.pass, user.password);

      if (!passwordMatch) {
        return Err(new Error('Invalid password'));
      }

      return Ok(user);
    } catch (error) {
      return Err(error);
    }
  }
}
