import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly dbErrorCode?: string,
    public readonly details?: string,
  ) {
    super(
      {
        message,
        error: HttpStatus[status],
        statusCode: status,
        dbErrorCode,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      status,
    );
  }
}

export class DatabaseConnectionException extends DatabaseException {
  constructor(
    message: string = 'Database connection failed',
    details?: string,
  ) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'CONNECTION_ERROR', details);
  }
}

export class DatabaseTimeoutException extends DatabaseException {
  constructor(
    message: string = 'Database query timed out',
    public readonly timeout: number = 30000,
    details?: string,
  ) {
    super(message, HttpStatus.REQUEST_TIMEOUT, 'QUERY_TIMEOUT', details);
  }

  getResponse(): any {
    const response = super.getResponse() as any;
    return {
      ...response,
      timeout: this.timeout,
    };
  }
}

export class DatabaseConstraintException extends DatabaseException {
  constructor(
    message: string = 'Database constraint violation',
    public readonly constraintName?: string,
    details?: string,
  ) {
    super(message, HttpStatus.CONFLICT, 'CONSTRAINT_VIOLATION', details);
  }

  getResponse(): any {
    const response = super.getResponse() as any;
    return {
      ...response,
      constraintName: this.constraintName,
    };
  }
}

export class DatabaseTransactionException extends DatabaseException {
  constructor(
    message: string = 'Database transaction failed',
    details?: string,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'TRANSACTION_ERROR',
      details,
    );
  }
}

export class DatabaseDeadlockException extends DatabaseException {
  constructor(
    message: string = 'Database deadlock detected',
    details?: string,
  ) {
    super(message, HttpStatus.CONFLICT, 'DEADLOCK_ERROR', details);
  }
}

export class DatabaseDiskFullException extends DatabaseException {
  constructor(message: string = 'Database disk is full', details?: string) {
    super(message, HttpStatus.INSUFFICIENT_STORAGE, 'DISK_FULL', details);
  }
}
