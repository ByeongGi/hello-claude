import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './application/auth/auth.module';
import { HealthModule } from './infrastructure/health/health.module';
import { SeedModule } from './infrastructure/database/seeds/seed.module';
import { getDatabaseConfig } from './infrastructure/database/database.config';
import { AllExceptionsFilter } from './infrastructure/common/filters/http-exception.filter';
import { LoggingInterceptor } from './infrastructure/common/interceptors/logging.interceptor';
import { ValidationPipe } from './infrastructure/common/pipes/validation.pipe';
import { JwtAuthGuard } from './infrastructure/auth/guards/jwt-auth.guard';
import {
  DatabaseExceptionFilter,
  CustomDatabaseExceptionFilter,
} from './application/common/filters/database-exception.filter';
import { DatabaseRetryInterceptor } from './application/common/interceptors/database-retry.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    UserModule,
    AuthModule,
    HealthModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: CustomDatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseRetryInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
