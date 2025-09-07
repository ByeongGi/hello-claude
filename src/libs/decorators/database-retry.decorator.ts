import { applyDecorators, SetMetadata } from '@nestjs/common';

export const RETRY_METADATA_KEY = 'database_retry';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryableErrors?: string[];
}

export const DatabaseRetry = (options: RetryOptions = {}) => {
  const defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    retryableErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'CONNECTION_ERROR',
      'QUERY_TIMEOUT',
      '40P01', // PostgreSQL deadlock
      '53300', // Too many connections
    ],
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return applyDecorators(SetMetadata(RETRY_METADATA_KEY, mergedOptions));
};
