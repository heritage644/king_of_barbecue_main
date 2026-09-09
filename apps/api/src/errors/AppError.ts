export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'STORE_PAUSED'
  | 'INVALID_STATE_TRANSITION'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication is required.') {
    return new AppError(401, 'AUTHENTICATION_REQUIRED', message);
  }

  static invalidCredentials() {
    return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  static forbidden(message = 'You are not allowed to perform this action.') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(409, 'CONFLICT', message, details);
  }
}
