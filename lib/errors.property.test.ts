// Feature: mesahomes-lead-generation, Property 22: Structured Error Response Format

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ErrorCode,
  ERROR_HTTP_STATUS,
  AppError,
  createErrorResponse,
  toLambdaResponse,
} from './errors.js';
import type { ErrorResponse } from './errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** UUID v4 regex — matches the output of `crypto.randomUUID()`. */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** All 15 ErrorCode enum values as an array for the fast-check generator. */
const ALL_ERROR_CODES = Object.values(ErrorCode) as ErrorCode[];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates one of the 15 ErrorCode enum values uniformly at random. */
const errorCodeArb: fc.Arbitrary<ErrorCode> = fc.constantFrom(...ALL_ERROR_CODES);

/** Generates a non-empty human-readable message string. */
const messageArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 200 });

/** Generates a single field-level error detail. */
const fieldErrorArb = fc.record({
  field: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 200 }),
});

/**
 * Generates an optional array of field-level details.
 * `undefined` means no details; otherwise 1–5 field errors.
 */
const optionalDetailsArb = fc.option(
  fc.array(fieldErrorArb, { minLength: 1, maxLength: 5 }),
  { nil: undefined },
);

// ---------------------------------------------------------------------------
// Property 22: Structured Error Response Format
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 45.4**
 *
 * For any API error (validation error, internal error, auth error), the
 * response SHALL contain:
 *   (a) an `errorCode` string
 *   (b) a human-readable `message` string
 *   (c) a `correlationId` string matching UUID format
 * and the HTTP status code SHALL be appropriate for the error type.
 */
describe('Property 22: Structured Error Response Format', () => {
  it('createErrorResponse produces a well-structured response for any error combination', () => {
    fc.assert(
      fc.property(
        errorCodeArb,
        messageArb,
        optionalDetailsArb,
        (code, message, details) => {
          // --- Arrange ---
          const appError = new AppError(code, message, undefined, details);

          // --- Act ---
          const response: ErrorResponse = createErrorResponse(appError);

          // --- Assert (a): errorCode is a string matching the enum value ---
          expect(typeof response.error.code).toBe('string');
          expect(response.error.code).toBe(code);

          // --- Assert (b): message is a human-readable string ---
          expect(typeof response.error.message).toBe('string');
          expect(response.error.message).toBe(message);

          // --- Assert (c): correlationId is a UUID v4 string ---
          expect(typeof response.error.correlationId).toBe('string');
          expect(response.error.correlationId).toMatch(UUID_V4_REGEX);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('toLambdaResponse returns the correct HTTP status and valid JSON body for any error', () => {
    fc.assert(
      fc.property(
        errorCodeArb,
        messageArb,
        optionalDetailsArb,
        (code, message, details) => {
          // --- Arrange ---
          const appError = new AppError(code, message, undefined, details);

          // --- Act ---
          const lambdaResponse = toLambdaResponse(appError);

          // --- Assert: statusCode matches ERROR_HTTP_STATUS for this code ---
          expect(lambdaResponse.statusCode).toBe(ERROR_HTTP_STATUS[code]);

          // --- Assert: body is valid JSON ---
          let parsed: ErrorResponse;
          expect(() => {
            parsed = JSON.parse(lambdaResponse.body) as ErrorResponse;
          }).not.toThrow();

          parsed = JSON.parse(lambdaResponse.body) as ErrorResponse;

          // --- Assert: parsed body has the required structure ---
          expect(typeof parsed.error.code).toBe('string');
          expect(parsed.error.code).toBe(code);

          expect(typeof parsed.error.message).toBe('string');
          expect(parsed.error.message).toBe(message);

          expect(typeof parsed.error.correlationId).toBe('string');
          expect(parsed.error.correlationId).toMatch(UUID_V4_REGEX);

          // --- Assert: details round-trip through JSON correctly ---
          if (details && details.length > 0) {
            expect(parsed.error.details).toEqual(details);
          } else {
            expect(parsed.error.details).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
