import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryBus } from '@nestjs/cqrs';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '@/modules/users/dtos/user.response.dto';
import { ValidateUserQuery } from '@/modules/users/application/queries/validate-user/validate-user.query';
import { FindUserByIdQuery } from '@/modules/users/application/queries/find-user-by-id/find-user-by-id.query';
import { UserEntity } from '@/modules/users/domain/user.entity';
import { Result } from 'oxide.ts';
import { UserMapper } from '@/modules/users/user.mapper';

@Injectable()
export class AuthService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly userMapper: UserMapper,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const query = new ValidateUserQuery({
      email: loginDto.email,
      pass: loginDto.password,
    });

    const result: Result<UserEntity, Error> =
      await this.queryBus.execute(query);

    const userEntity = result.unwrapOr(null);
    if (!userEntity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // This is a placeholder for a real role system
    const userRole = (userEntity.getProps() as any).role || 'user';
    const userIsActive = (userEntity.getProps() as any).isActive !== false;

    if (!userIsActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const user = this.userMapper.toResponse(userEntity);
    const payload = { sub: user.id, email: user.email, role: userRole };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.validateUser(payload);

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: (user as any).role,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: any): Promise<UserResponseDto> {
    const query = new FindUserByIdQuery({ id: payload.sub });
    const result: Result<UserResponseDto, Error> =
      await this.queryBus.execute(query);

    const user = result.unwrapOr(null);

    if (!user || !(user as any).isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
