/**
 * Shared error handling module for the MesaHomes platform.
 *
 * Provides structured error responses, error code → HTTP status mapping,
 * convenience factories for common error types, and Lambda proxy integration
 * formatting. Every error includes a UUID correlation ID for request tracing
 * across Lambda → DynamoDB → SES → external APIs.
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

/** All platform error codes mapped to their HTTP status. */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  NOT_FOUND = 'NOT_FOUND',
  UPSTREAM_TIMEOUT = 'UPSTREAM_TIMEOUT',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_ERROR = 'AI_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

// ---------------------------------------------------------------------------
// HTTP status mapping
// ---------------------------------------------------------------------------

/** Maps each error code to its correct HTTP status code. */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ACCOUNT_LOCKED]: 429,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.STORAGE_ERROR]: 500,
  [ErrorCode.NOTIFICATION_ERROR]: 500,
  [ErrorCode.UPSTREAM_ERROR]: 502,
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.UPSTREAM_TIMEOUT]: 504,
  [ErrorCode.AI_TIMEOUT]: 504,
  [ErrorCode.AI_ERROR]: 500,
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A single field-level error detail. */
export interface FieldError {
  field: string;
  message: string;
}

/** Structured error response body returned to API clients. */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    correlationId: string;
    details?: FieldError[];
  };
}

/** API Gateway Lambda proxy integration response shape. */
export interface LambdaProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ---------------------------------------------------------------------------
// AppError class
// ---------------------------------------------------------------------------

/**
 * Application error with structured metadata for API responses.
 *
 * Extends the native Error class with an error code, HTTP status,
 * correlation ID, and optional field-level details.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly correlationId: string;
  readonly details?: FieldError[];

  constructor(
    code: ErrorCode,
    message: string,
    correlationId?: string,
    details?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
    this.correlationId = correlationId ?? generateCorrelationId();
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Correlation ID
// ---------------------------------------------------------------------------

/**
 * Generate a UUID v4 correlation ID for request tracing.
 *
 * Uses the built-in `crypto.randomUUID()` available in Node.js 20+.
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Response factories
// ---------------------------------------------------------------------------

/**
 * Format an {@link AppError} into the standard {@link ErrorResponse} structure.
 */
export function createErrorResponse(error: AppError): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      correlationId: error.correlationId,
    },
  };

  if (error.details && error.details.length > 0) {
    response.error.details = error.details;
  }

  return response;
}

/**
 * Convenience factory for validation errors with multiple field-level issues.
 */
export function createValidationError(
  fieldErrors: FieldError[],
  correlationId?: string,
): AppError {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    'One or more fields are invalid',
    correlationId,
    fieldErrors,
  );
}

/**
 * Convenience factory for a missing required field error.
 */
export function createMissingFieldError(
  field: string,
  correlationId?: string,
): AppError {
  return new AppError(
    ErrorCode.MISSING_FIELD,
    `${field} is required`,
    correlationId,
    [{ field, message: `${field} is required` }],
  );
}

/**
 * Convenience factory for an invalid format error.
 */
export function createInvalidFormatError(
  field: string,
  expectedFormat: string,
  correlationId?: string,
): AppError {
  return new AppError(
    ErrorCode.INVALID_FORMAT,
    `${field} must be a valid ${expectedFormat}`,
    correlationId,
    [{ field, message: `${field} must be a valid ${expectedFormat}` }],
  );
}

// ---------------------------------------------------------------------------
// Lambda proxy integration
// ---------------------------------------------------------------------------

/** Default CORS headers for API Gateway responses. */
const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

/**
 * Convert an {@link AppError} into an API Gateway Lambda proxy response.
 *
 * Returns `{ statusCode, headers, body }` with CORS headers and a
 * JSON-serialized {@link ErrorResponse} body.
 */
export function toLambdaResponse(error: AppError): LambdaProxyResponse {
  return {
    statusCode: error.httpStatus,
    headers: { ...CORS_HEADERS },
    body: JSON.stringify(createErrorResponse(error)),
  };
}
