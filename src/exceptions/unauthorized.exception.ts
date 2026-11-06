/**
 * A custom exception that represents a Unauthorized error.
 */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { ExceptionConstants } from './exceptions.constants';
import { IException, IHttpUnauthorizedExceptionResponse } from './exceptions.interface';

/**
 * A custom exception for unauthorized access errors.
 */
export class UnauthorizedException extends HttpException {
  /** The error code. */
  @ApiProperty({
    enum: ExceptionConstants.UnauthorizedCodes,
    description: 'A unique code identifying the error.',
    example: ExceptionConstants.UnauthorizedCodes.TOKEN_EXPIRED_ERROR,
  })
  code: number;

  /** The error message. */
  @ApiProperty({
    description: 'Message for the exception',
    example: 'The authentication token provided has expired.',
  })
  message: string;

  /** The detailed description of the error. */
  @ApiProperty({
    description: 'A description of the error message.',
    example:
      'This error message indicates that the authentication token provided with the request has expired, and therefore the server cannot verify the users identity.',
  })
  description: string;

  /**
   * Constructs a new UnauthorizedException object.
   * @param exception An object containing the exception details.
   *  - message: A string representing the error message.
   *  - cause: An object representing the cause of the error.
   *  - description: A string describing the error in detail.
   *  - code: A number representing internal status code which helpful in future for frontend
   */
  constructor(exception: IException) {
    super(exception.message, HttpStatus.UNAUTHORIZED, {
      description: exception.description,
    });

    this.message = exception.message;
    this.description = exception.description || 'Unauthorized Exception';
    this.code = exception.code || ExceptionConstants.UnauthorizedCodes.UNAUTHORIZED_ACCESS;
  }

  /**
   * Generate an HTTP response body representing the BadRequestException instance.
   * @param message A string representing the message to include in the response body.
   * @returns An object representing the HTTP response body.
   */
  generateHttpResponseBody = (message?: string): IHttpUnauthorizedExceptionResponse => {
    return {
      code: this.code,
      message: message || this.message,
      success: false,
    };
  };

  /**
   * A static method to generate an exception for token expiration error.
   * @param msg - An optional error message.
   * @returns An instance of the UnauthorizedException class.
   */
  static TOKEN_EXPIRED_ERROR = (msg?: string) => {
    return new UnauthorizedException({
      message: msg || 'The authentication token provided has expired.',
      code: ExceptionConstants.UnauthorizedCodes.TOKEN_EXPIRED_ERROR,
      success: false,
    });
  };

  /**
   * A static method to generate an exception for invalid JSON web token.
   * @param msg - An optional error message.
   * @returns An instance of the UnauthorizedException class.
   */
  static JSON_WEB_TOKEN_ERROR = (msg?: string) => {
    return new UnauthorizedException({
      message: msg || 'Invalid token specified.',
      code: ExceptionConstants.UnauthorizedCodes.JSON_WEB_TOKEN_ERROR,
      success: false,
    });
  };

  /**
   * A static method to generate an exception for unauthorized access to a resource.
   * @param description - An optional detailed description of the error.
   * @returns An instance of the UnauthorizedException class.
   */
  static UNAUTHORIZED_ACCESS = (description?: string) => {
    return new UnauthorizedException({
      message: description || 'Unauthorized access to the requested resource.',
      description,
      success: false,
    });
  };

  /**
   * Create a UnauthorizedException for when a resource is not found.
   * @param {string} [msg] - Optional message for the exception.
   * @returns {BadRequestException} - A UnauthorizedException with the appropriate error code and message.
   */
  static RESOURCE_NOT_FOUND = (msg?: string) => {
    return new UnauthorizedException({
      message: msg || 'Resource Not Found',
      code: ExceptionConstants.UnauthorizedCodes.RESOURCE_NOT_FOUND,
      success: false,
    });
  };

  /**
   * Create a UnauthorizedException for when a resource is not found.
   * @param {string} [msg] - Optional message for the exception.
   * @returns {BadRequestException} - A UnauthorizedException with the appropriate error code and message.
   */
  static USER_NOT_VERIFIED = (msg?: string) => {
    return new UnauthorizedException({
      message: msg || 'User not verified. Please complete verification process before attempting this action.',
      code: ExceptionConstants.UnauthorizedCodes.USER_NOT_VERIFIED,
      success: false,
    });
  };

  /**
   * A static method to generate an exception for unexpected errors.
   * @param error - The error that caused this exception.
   * @returns An instance of the UnauthorizedException class.
   */
  static UNEXPECTED_ERROR = (error: any) => {
    return new UnauthorizedException({
      message: 'An unexpected error occurred while processing the request. Please try again later.',
      code: ExceptionConstants.UnauthorizedCodes.UNEXPECTED_ERROR,
      success: false,
    });
  };

  /**
   * A static method to generate an exception for when a forgot or change password time previous login token needs to be re-issued.
   * @param msg - An optional error message.
   * @returns - An instance of the UnauthorizedException class.
   */
  static REQUIRED_RE_AUTHENTICATION = (msg?: string) => {
    return new UnauthorizedException({
      message:
        msg ||
        'Your previous login session has been terminated due to a password change or reset. Please log in again with your new password.',
      code: ExceptionConstants.UnauthorizedCodes.REQUIRED_RE_AUTHENTICATION,
      success: false,
    });
  };

  /**
   * A static method to generate an exception for reset password token is invalid.
   * @param msg - An optional error message.
   * @returns - An instance of the UnauthorizedException class.
   */
  static INVALID_RESET_PASSWORD_TOKEN = (msg?: string) => {
    return new UnauthorizedException({
      message: msg || 'The reset password token provided is invalid. Please request a new reset password token.',
      code: ExceptionConstants.UnauthorizedCodes.INVALID_RESET_PASSWORD_TOKEN,
      success: false,
    });
  };
}
