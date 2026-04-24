import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  ERROR_HTTP_STATUS,
  AppError,
  generateCorrelationId,
  createErrorResponse,
  createValidationError,
  createMissingFieldError,
  createInvalidFormatError,
  toLambdaResponse,
} from './errors.js';
import type { ErrorResponse, LambdaProxyResponse } from './errors.js';

// ---------------------------------------------------------------------------
// UUID v4 regex for correlation ID validation
// ---------------------------------------------------------------------------

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

describe('ERROR_HTTP_STATUS mapping', () => {
  it('should map VALIDATION_ERROR to 400', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.VALIDATION_ERROR]).toBe(400);
  });

  it('should map MISSING_FIELD to 400', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.MISSING_FIELD]).toBe(400);
  });

  it('should map INVALID_FORMAT to 400', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.INVALID_FORMAT]).toBe(400);
  });

  it('should map UNAUTHORIZED to 401', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.UNAUTHORIZED]).toBe(401);
  });

  it('should map FORBIDDEN to 403', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.FORBIDDEN]).toBe(403);
  });

  it('should map NOT_FOUND to 404', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.NOT_FOUND]).toBe(404);
  });

  it('should map ACCOUNT_LOCKED to 429', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.ACCOUNT_LOCKED]).toBe(429);
  });

  it('should map RATE_LIMITED to 429', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.RATE_LIMITED]).toBe(429);
  });

  it('should map STORAGE_ERROR to 500', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.STORAGE_ERROR]).toBe(500);
  });

  it('should map NOTIFICATION_ERROR to 500', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.NOTIFICATION_ERROR]).toBe(500);
  });

  it('should map UPSTREAM_ERROR to 502', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.UPSTREAM_ERROR]).toBe(502);
  });

  it('should map PAYMENT_FAILED to 402', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.PAYMENT_FAILED]).toBe(402);
  });

  it('should map UPSTREAM_TIMEOUT to 504', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.UPSTREAM_TIMEOUT]).toBe(504);
  });

  it('should map AI_TIMEOUT to 504', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.AI_TIMEOUT]).toBe(504);
  });

  it('should map AI_ERROR to 500', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.AI_ERROR]).toBe(500);
  });

  it('should have a mapping for every ErrorCode value', () => {
    const allCodes = Object.values(ErrorCode);
    for (const code of allCodes) {
      expect(ERROR_HTTP_STATUS[code]).toBeDefined();
      expect(typeof ERROR_HTTP_STATUS[code]).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// AppError class
// ---------------------------------------------------------------------------

describe('AppError', () => {
  it('should extend Error', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Resource not found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('should set name to AppError', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Resource not found');
    expect(err.name).toBe('AppError');
  });

  it('should store code, message, and httpStatus', () => {
    const err = new AppError(ErrorCode.FORBIDDEN, 'No access');
    expect(err.code).toBe(ErrorCode.FORBIDDEN);
    expect(err.message).toBe('No access');
    expect(err.httpStatus).toBe(403);
  });

  it('should auto-generate a correlation ID when none is provided', () => {
    const err = new AppError(ErrorCode.STORAGE_ERROR, 'Write failed');
    expect(err.correlationId).toMatch(UUID_V4_REGEX);
  });

  it('should use the provided correlation ID', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const err = new AppError(ErrorCode.STORAGE_ERROR, 'Write failed', id);
    expect(err.correlationId).toBe(id);
  });

  it('should store optional field-level details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid', undefined, details);
    expect(err.details).toEqual(details);
  });

  it('should leave details undefined when not provided', () => {
    const err = new AppError(ErrorCode.UNAUTHORIZED, 'Please log in');
    expect(err.details).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateCorrelationId
// ---------------------------------------------------------------------------

describe('generateCorrelationId', () => {
  it('should return a valid UUID v4 string', () => {
    const id = generateCorrelationId();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('should return unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateCorrelationId()));
    expect(ids.size).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// createErrorResponse
// ---------------------------------------------------------------------------

describe('createErrorResponse', () => {
  it('should format an AppError into the design spec structure', () => {
    const correlationId = '550e8400-e29b-41d4-a716-446655440000';
    const err = new AppError(ErrorCode.NOT_FOUND, 'Resource not found', correlationId);
    const response: ErrorResponse = createErrorResponse(err);

    expect(response).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        correlationId,
      },
    });
  });

  it('should include details when present', () => {
    const details = [
      { field: 'email', message: 'Must be a valid email address' },
      { field: 'phone', message: 'Must be a valid US phone number' },
    ];
    const err = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'One or more fields are invalid',
      'abc-123',
      details,
    );
    const response = createErrorResponse(err);

    expect(response.error.details).toEqual(details);
  });

  it('should omit details when the array is empty', () => {
    const err = new AppError(ErrorCode.UNAUTHORIZED, 'Please log in', 'abc-123', []);
    const response = createErrorResponse(err);

    expect(response.error.details).toBeUndefined();
  });

  it('should omit details when not provided', () => {
    const err = new AppError(ErrorCode.FORBIDDEN, 'No access', 'abc-123');
    const response = createErrorResponse(err);

    expect(response.error).not.toHaveProperty('details');
  });
});

// ---------------------------------------------------------------------------
// createValidationError
// ---------------------------------------------------------------------------

describe('createValidationError', () => {
  it('should create a VALIDATION_ERROR with multiple field errors', () => {
    const fieldErrors = [
      { field: 'email', message: 'Must be a valid email address' },
      { field: 'phone', message: 'Must be a valid US phone number' },
    ];
    const err = createValidationError(fieldErrors);

    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('One or more fields are invalid');
    expect(err.details).toEqual(fieldErrors);
    expect(err.correlationId).toMatch(UUID_V4_REGEX);
  });

  it('should accept a custom correlation ID', () => {
    const err = createValidationError(
      [{ field: 'name', message: 'Required' }],
      'custom-id',
    );
    expect(err.correlationId).toBe('custom-id');
  });
});

// ---------------------------------------------------------------------------
// createMissingFieldError
// ---------------------------------------------------------------------------

describe('createMissingFieldError', () => {
  it('should create a MISSING_FIELD error for the given field', () => {
    const err = createMissingFieldError('email');

    expect(err.code).toBe(ErrorCode.MISSING_FIELD);
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('email is required');
    expect(err.details).toEqual([{ field: 'email', message: 'email is required' }]);
  });

  it('should accept a custom correlation ID', () => {
    const err = createMissingFieldError('phone', 'trace-123');
    expect(err.correlationId).toBe('trace-123');
  });
});

// ---------------------------------------------------------------------------
// createInvalidFormatError
// ---------------------------------------------------------------------------

describe('createInvalidFormatError', () => {
  it('should create an INVALID_FORMAT error with field and expected format', () => {
    const err = createInvalidFormatError('email', 'email address');

    expect(err.code).toBe(ErrorCode.INVALID_FORMAT);
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('email must be a valid email address');
    expect(err.details).toEqual([
      { field: 'email', message: 'email must be a valid email address' },
    ]);
  });

  it('should accept a custom correlation ID', () => {
    const err = createInvalidFormatError('phone', 'US phone number', 'trace-456');
    expect(err.correlationId).toBe('trace-456');
  });
});

// ---------------------------------------------------------------------------
// toLambdaResponse
// ---------------------------------------------------------------------------

describe('toLambdaResponse', () => {
  it('should return correct statusCode from the error', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Not found', 'id-1');
    const response: LambdaProxyResponse = toLambdaResponse(err);

    expect(response.statusCode).toBe(404);
  });

  it('should return a JSON-serialized ErrorResponse body', () => {
    const err = new AppError(ErrorCode.UNAUTHORIZED, 'Please log in', 'id-2');
    const response = toLambdaResponse(err);
    const body = JSON.parse(response.body) as ErrorResponse;

    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Please log in');
    expect(body.error.correlationId).toBe('id-2');
  });

  it('should include CORS headers', () => {
    const err = new AppError(ErrorCode.STORAGE_ERROR, 'Write failed', 'id-3');
    const response = toLambdaResponse(err);

    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('should include details in the body when present', () => {
    const err = createValidationError(
      [{ field: 'zip', message: 'Invalid ZIP code' }],
      'id-4',
    );
    const response = toLambdaResponse(err);
    const body = JSON.parse(response.body) as ErrorResponse;

    expect(body.error.details).toEqual([
      { field: 'zip', message: 'Invalid ZIP code' },
    ]);
  });

  it('should use the correct status for each error type', () => {
    const cases: Array<[ErrorCode, number]> = [
      [ErrorCode.VALIDATION_ERROR, 400],
      [ErrorCode.PAYMENT_FAILED, 402],
      [ErrorCode.UPSTREAM_ERROR, 502],
      [ErrorCode.AI_TIMEOUT, 504],
      [ErrorCode.RATE_LIMITED, 429],
    ];

    for (const [code, expectedStatus] of cases) {
      const err = new AppError(code, 'test', 'id');
      const response = toLambdaResponse(err);
      expect(response.statusCode).toBe(expectedStatus);
    }
  });
});
