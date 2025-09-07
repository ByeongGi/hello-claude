import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthService } from './auth.service';
import { AuthController } from '@/infrastructure/auth/auth.controller';
import { JwtStrategy } from '@/infrastructure/auth/strategies/jwt.strategy';
import { UserMapper } from '@/modules/users/user.mapper';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(
          'JWT_SECRET',
          'default-secret-change-in-production',
        ),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserMapper],
  exports: [AuthService],
})
export class AuthModule {}
