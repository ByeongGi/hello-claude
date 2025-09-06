import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { catchError, delay, retryWhen, scan } from 'rxjs/operators';
import { QueryFailedError, TypeORMError } from 'typeorm';
import {
  RETRY_METADATA_KEY,
  RetryOptions,
} from '../decorators/database-retry.decorator';
import {
  DatabaseConnectionException,
  DatabaseTimeoutException,
} from '../exceptions/database.exception';

@Injectable()
export class DatabaseRetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabaseRetryInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const retryOptions = this.reflector.get<RetryOptions>(
      RETRY_METADATA_KEY,
      context.getHandler(),
    );

    if (!retryOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = `${context.getClass().name}.${context.getHandler().name}`;

    return next.handle().pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((retryCount, error) => {
            if (retryCount >= retryOptions.maxAttempts) {
              this.logger.error(
                `Database operation failed after ${retryOptions.maxAttempts} attempts: ${methodName}`,
                {
                  error: error.message,
                  url: request.url,
                  method: request.method,
                },
              );
              throw error;
            }

            if (!this.isRetryableError(error, retryOptions.retryableErrors)) {
              this.logger.debug(
                `Non-retryable error encountered: ${error.message}`,
                { methodName },
              );
              throw error;
            }

            const delayTime = Math.min(
              retryOptions.delayMs *
                Math.pow(retryOptions.backoffMultiplier, retryCount),
              retryOptions.maxDelayMs,
            );

            this.logger.warn(
              `Database operation failed, retrying in ${delayTime}ms (attempt ${retryCount + 1}/${retryOptions.maxAttempts}): ${methodName}`,
              {
                error: error.message,
                delayTime,
                retryCount: retryCount + 1,
              },
            );

            return retryCount + 1;
          }, 0),
          delay(retryOptions.delayMs),
        ),
      ),
      catchError((error) => {
        // 재시도 후에도 실패한 경우 적절한 예외로 변환
        if (
          error instanceof QueryFailedError ||
          error instanceof TypeORMError
        ) {
          const errorCode = (error as any).code;

          if (this.isConnectionError(errorCode)) {
            throw new DatabaseConnectionException(
              'Database connection failed after multiple retry attempts',
              error.message,
            );
          }

          if (this.isTimeoutError(errorCode)) {
            throw new DatabaseTimeoutException(
              'Database query timed out after multiple retry attempts',
              30000,
              error.message,
            );
          }
        }

        throw error;
      }),
    );
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    if (error instanceof QueryFailedError || error instanceof TypeORMError) {
      const errorCode = (error as any).code;
      return retryableErrors.includes(errorCode);
    }

    if (
      error instanceof DatabaseConnectionException ||
      error instanceof DatabaseTimeoutException
    ) {
      return true;
    }

    // 일반적인 네트워크 에러들
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    return false;
  }

  private isConnectionError(errorCode: string): boolean {
    return [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'CONNECTION_ERROR',
    ].includes(errorCode);
  }

  private isTimeoutError(errorCode: string): boolean {
    return ['57014', 'QUERY_TIMEOUT'].includes(errorCode);
  }
}
