import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';
import { DatabaseException } from '@/libs/exceptions/database.exception';

@Catch(TypeORMError, QueryFailedError, EntityNotFoundError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(
    exception: TypeORMError | QueryFailedError | EntityNotFoundError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 에러 로깅
    this.logger.error(`Database Error: ${exception.message}`, exception.stack, {
      url: request.url,
      method: request.method,
      body: request.body,
      params: request.params,
      query: request.query,
      headers: request.headers,
    });

    let status: HttpStatus;
    let message: string;
    let dbErrorCode: string;
    let additionalData: any = {};

    if (exception instanceof QueryFailedError) {
      const result = this.handleQueryFailedError(exception);
      status = result.status;
      message = result.message;
      dbErrorCode = result.dbErrorCode;
      additionalData = result.additionalData;
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'The requested resource was not found';
      dbErrorCode = 'ENTITY_NOT_FOUND';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected database error occurred';
      dbErrorCode = 'UNKNOWN_DATABASE_ERROR';
    }

    const errorResponse = {
      statusCode: status,
      message,
      error: HttpStatus[status],
      timestamp: new Date().toISOString(),
      path: request.url,
      dbErrorCode,
      ...(process.env.NODE_ENV === 'development' && {
        details: exception.message,
      }),
      ...additionalData,
    };

    response.status(status).json(errorResponse);
  }

  private handleQueryFailedError(exception: QueryFailedError): {
    status: HttpStatus;
    message: string;
    dbErrorCode: string;
    additionalData?: any;
  } {
    const errorCode = (exception as any).code;
    const message = exception.message;

    // PostgreSQL 에러 코드별 처리
    switch (errorCode) {
      // Connection errors
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
      case 'ETIMEDOUT':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database connection failed',
          dbErrorCode: 'CONNECTION_ERROR',
        };

      // Unique constraint violation
      case '23505':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with this information already exists',
          dbErrorCode: 'UNIQUE_CONSTRAINT_VIOLATION',
          additionalData: {
            constraintName: this.extractConstraintName(message),
          },
        };

      // Foreign key constraint violation
      case '23503':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Referenced record does not exist or cannot be deleted',
          dbErrorCode: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          additionalData: {
            constraintName: this.extractConstraintName(message),
          },
        };

      // Not null constraint violation
      case '23502':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required field is missing',
          dbErrorCode: 'NOT_NULL_CONSTRAINT_VIOLATION',
          additionalData: {
            field: this.extractFieldName(message),
          },
        };

      // Check constraint violation
      case '23514':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid data value provided',
          dbErrorCode: 'CHECK_CONSTRAINT_VIOLATION',
          additionalData: {
            constraintName: this.extractConstraintName(message),
          },
        };

      // Deadlock detected
      case '40P01':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Database operation conflict detected, please retry',
          dbErrorCode: 'DEADLOCK_DETECTED',
        };

      // Disk full
      case '53100':
        return {
          status: HttpStatus.INSUFFICIENT_STORAGE,
          message: 'Database storage is full',
          dbErrorCode: 'DISK_FULL',
        };

      // Query timeout
      case '57014':
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database query took too long to execute',
          dbErrorCode: 'QUERY_TIMEOUT',
          additionalData: {
            timeout: 30000,
          },
        };

      // Invalid input syntax
      case '22P02':
      case '22001':
      case '22003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid data format or value',
          dbErrorCode: 'INVALID_INPUT_SYNTAX',
        };

      // Too many connections
      case '53300':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database is temporarily unavailable due to high load',
          dbErrorCode: 'TOO_MANY_CONNECTIONS',
        };

      // Default case
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected database error occurred',
          dbErrorCode: 'UNKNOWN_QUERY_ERROR',
        };
    }
  }

  private extractConstraintName(message: string): string | undefined {
    const constraintMatch = message.match(/constraint "([^"]+)"/);
    return constraintMatch ? constraintMatch[1] : undefined;
  }

  private extractFieldName(message: string): string | undefined {
    const fieldMatch = message.match(/column "([^"]+)"/);
    return fieldMatch ? fieldMatch[1] : undefined;
  }
}

@Catch(DatabaseException)
export class CustomDatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomDatabaseExceptionFilter.name);

  catch(exception: DatabaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.error(
      `Custom Database Error: ${exception.message}`,
      exception.stack,
      {
        url: request.url,
        method: request.method,
        dbErrorCode: exception.dbErrorCode,
      },
    );

    const errorResponse = {
      ...(typeof exception.getResponse === 'function'
        ? (exception.getResponse() as object)
        : { message: exception.message }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(exception.getStatus()).json(errorResponse);
  }
}
