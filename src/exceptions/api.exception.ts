import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The one exception type the booking API throws. Every error response is
 * `{ "error": "<machine_code>", "message": "<human text>" }`.
 */
export class ApiException extends HttpException {
  readonly code: string;
  readonly headers: Record<string, string>;

  constructor(status: HttpStatus, code: string, message: string, headers: Record<string, string> = {}) {
    super(message, status);
    this.code = code;
    this.headers = headers;
  }

  static UNAUTHORIZED = () => new ApiException(HttpStatus.UNAUTHORIZED, 'unauthorized', 'missing or invalid API key');
  static VALIDATION = (msg: string) => new ApiException(HttpStatus.BAD_REQUEST, 'validation_error', msg);
  static SLOT_NOT_FOUND = () => new ApiException(HttpStatus.NOT_FOUND, 'slot_not_found', 'slot not found');
  static BOOKING_NOT_FOUND = () => new ApiException(HttpStatus.NOT_FOUND, 'booking_not_found', 'booking not found');
  static SLOT_STARTED = () => new ApiException(HttpStatus.BAD_REQUEST, 'slot_started', 'slot has already started');
  static SLOT_TAKEN = () => new ApiException(HttpStatus.CONFLICT, 'slot_taken', 'slot already booked');
  static ALREADY_CANCELLED = () => new ApiException(HttpStatus.CONFLICT, 'already_cancelled', 'booking already cancelled');
  static REQUEST_IN_PROGRESS = () =>
    new ApiException(HttpStatus.CONFLICT, 'request_in_progress', 'a request with this Idempotency-Key is still being processed, retry shortly');
  static IDEMPOTENCY_KEY_REUSED = () =>
    new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'idempotency_key_reused', 'Idempotency-Key was already used with a different request body');
  static RATE_LIMITED = (retryAfterSeconds: number) =>
    new ApiException(HttpStatus.TOO_MANY_REQUESTS, 'rate_limited', 'too many attempts for this email, try again later', {
      'Retry-After': String(retryAfterSeconds),
    });
}
