import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

export class DatabaseErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Database error message',
    example: 'Database connection failed',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Database error code (if available)',
    example: 'CONNECTION_LOST',
    required: false,
  })
  dbErrorCode?: string;

  @ApiProperty({
    description: 'Database error details (development only)',
    example: 'Connection terminated unexpectedly',
    required: false,
  })
  details?: string;
}

export class DatabaseConnectionErrorResponseDto extends DatabaseErrorResponseDto {
  @ApiProperty({
    description: 'Database connection error message',
    example: 'Unable to connect to the database',
  })
  message: string;

  @ApiProperty({
    description: 'Database error code',
    example: 'ECONNREFUSED',
  })
  dbErrorCode: string;
}

export class DatabaseTimeoutErrorResponseDto extends DatabaseErrorResponseDto {
  @ApiProperty({
    description: 'Database timeout error message',
    example: 'Database query timed out',
  })
  message: string;

  @ApiProperty({
    description: 'Database error code',
    example: 'QUERY_TIMEOUT',
  })
  dbErrorCode: string;

  @ApiProperty({
    description: 'Query timeout duration in milliseconds',
    example: 30000,
  })
  timeout: number;
}

export class DatabaseConstraintErrorResponseDto extends DatabaseErrorResponseDto {
  @ApiProperty({
    description: 'Database constraint violation message',
    example: 'Foreign key constraint violation',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Database error code',
    example: 'FOREIGN_KEY_CONSTRAINT',
  })
  dbErrorCode: string;

  @ApiProperty({
    description: 'Constraint name',
    example: 'fk_user_role',
    required: false,
  })
  constraintName?: string;
}
