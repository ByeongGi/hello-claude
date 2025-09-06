import {
  ValidationPipe as NestValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true, // 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // 허용되지 않은 속성 전송시 에러
      transform: true, // DTO 인스턴스로 자동 변환
      transformOptions: {
        enableImplicitConversion: true, // 암시적 타입 변환 허용
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors: Record<string, string[]> =
          this.buildErrorMessages(validationErrors);
        return new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      },
    });
  }

  private buildErrorMessages(
    validationErrors: ValidationError[],
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of validationErrors) {
      if (error.children && error.children.length > 0) {
        result[error.property] = Object.values(
          this.buildErrorMessages(error.children),
        ).flat();
      } else {
        result[error.property] = Object.values(error.constraints || {});
      }
    }

    return result;
  }
}
