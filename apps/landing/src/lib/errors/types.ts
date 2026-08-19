export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ALREADY_EXISTS'
  | 'RATE_LIMITED'
  | 'BUSINESS_RULE_VIOLATION'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'TENANT_MISMATCH'
  | 'UNKNOWN_ERROR';

export interface UserFacingError {
  /**
   * The canonical domain error code.
   */
  code: DomainErrorCode;

  /**
   * The safe, PT-BR message to display to the user.
   */
  message: string;

  /**
   * Indicates if the error can be retried.
   */
  retryable: boolean;

  /**
   * Optional contextual action recommendation.
   */
  action?: string;
}
