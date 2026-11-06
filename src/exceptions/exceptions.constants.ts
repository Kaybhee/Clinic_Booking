/**
 * This class defines constants for HTTP error codes.
 */
export class ExceptionConstants {
  /**
   * Constants for bad request HTTP error codes.
   */
  public static readonly BadRequestCodes = {
    MISSING_REQUIRED_PARAMETER: 400, // Required parameter is missing from request
    INVALID_PARAMETER_VALUE: 400, // Parameter value is invalid
    UNSUPPORTED_PARAMETER: 400, // Request contains unsupported parameter
    INVALID_CONTENT_TYPE: 400, // Content type of request is invalid
    INVALID_REQUEST_BODY: 400, // Request body is invalid
    UNAUTHORIZED_ACCESS: 401, // Request body is invalid
    RESOURCE_ALREADY_EXISTS: 409, // Resource already exists
    RESOURCE_NOT_FOUND: 404, // Resource not found
    REQUEST_TOO_LARGE: 413, // Request is too large
    REQUEST_ENTITY_TOO_LARGE: 413, // Request entity is too large
    REQUEST_URI_TOO_LONG: 414, // Request URI is too long
    UNSUPPORTED_MEDIA_TYPE: 415, // Request contains unsupported media type
    METHOD_NOT_ALLOWED: 405, // Request method is not allowed
    HTTP_REQUEST_TIMEOUT: 408, // Request has timed out
    VALIDATION_ERROR: 422, // Request validation error
    UNEXPECTED_ERROR: 400, // Unexpected error occurred
    INVALID_INPUT: 400, // Invalid input
  };

  /**
   * Constants for unauthorized HTTP error codes.
   */
  public static readonly UnauthorizedCodes = {
    UNAUTHORIZED_ACCESS: 401, // Unauthorized access to resource
    INVALID_CREDENTIALS: 401, // Invalid credentials provided
    JSON_WEB_TOKEN_ERROR: 401, // JSON web token error
    AUTHENTICATION_FAILED: 401, // Authentication failed
    ACCESS_TOKEN_EXPIRED: 401, // Access token has expired
    TOKEN_EXPIRED_ERROR: 401, // Token has expired error
    UNEXPECTED_ERROR: 401, // Unexpected error occurred
    RESOURCE_NOT_FOUND: 404, // Resource not found
    USER_NOT_VERIFIED: 401, // User not verified
    REQUIRED_RE_AUTHENTICATION: 401, // Required re-authentication
    INVALID_RESET_PASSWORD_TOKEN: 401, // Invalid reset password token
  };

  /**
   * Constants for internal server error HTTP error codes.
   */
  public static readonly InternalServerErrorCodes = {
    INTERNAL_SERVER_ERROR: 500, // Internal server error
    DATABASE_ERROR: 500, // Database error
    NETWORK_ERROR: 500, // Network error
    THIRD_PARTY_SERVICE_ERROR: 502, // Third party service error
    SERVER_OVERLOAD: 503, // Server is overloaded
    UNEXPECTED_ERROR: 500, // Unexpected error occurred
  };

  /**
   * Constants for forbidden HTTP error codes.
   */
  public static readonly ForbiddenCodes = {
    FORBIDDEN: 403, // Access to resource is forbidden
    MISSING_PERMISSIONS: 403, // User does not have the required permissions to access the resource
    EXCEEDED_RATE_LIMIT: 429, // User has exceeded the rate limit for accessing the resource
    RESOURCE_NOT_FOUND: 404, // The requested resource could not be found
    TEMPORARILY_UNAVAILABLE: 503, // The requested resource is temporarily unavailable
  };
}
