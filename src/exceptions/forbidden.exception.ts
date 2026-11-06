/**
 * A custom exception that represents a Forbidden error.
 */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { ExceptionConstants } from './exceptions.constants';
import { IException, IHttpForbiddenExceptionResponse } from './exceptions.interface';

/**
 * A custom exception for forbidden errors.
 */
export class ForbiddenException extends HttpException {
  /** The error code. */
  @ApiProperty({
    enum: ExceptionConstants.ForbiddenCodes,
    description: 'You do not have permission to perform this action.',
    example: ExceptionConstants.ForbiddenCodes.MISSING_PERMISSIONS,
  })
  code: number;

  /** The error that caused this exception. */
  // @ApiHideProperty()
  // cause: Error;

  /** The error message. */
  @ApiProperty({
    description: 'Message for the exception',
    example: 'You do not have permission to perform this action.',
  })
  message: string;

  /** The detailed description of the error. */
  @ApiProperty({
    description: 'A description of the error message.',
  })
  description: string;

  /**
   * Constructs a new ForbiddenException object.
   * @param exception An object containing the exception details.
   *  - message: A string representing the error message.
   *  - cause: An object representing the cause of the error.
   *  - description: A string describing the error in detail.
   *  - code: A number representing internal status code which helpful in future for frontend
   */
  constructor(exception: IException) {
    super(exception.message, HttpStatus.FORBIDDEN, {
      description: exception.description,
    });

    this.message = exception.message;
    this.description = exception.description || 'Forbidden Exception';
    this.code = exception.code || ExceptionConstants.ForbiddenCodes.FORBIDDEN;
  }

  /**
   * Generate an HTTP response body representing the ForbiddenException instance.
   * @param message A string representing the message to include in the response body.
   * @returns An object representing the HTTP response body.
   */
  generateHttpResponseBody = (message?: string): IHttpForbiddenExceptionResponse => {
    return {
      code: this.code,
      message: message || this.message,
      success: false,
    };
  };

  /**
   * A static method to generate an exception forbidden error.
   * @param msg - An optional error message.
   * @returns An instance of the ForbiddenException class.
   */
  static FORBIDDEN = (msg?: string) => {
    return new ForbiddenException({
      message: msg || 'Access to this resource is forbidden.',
      code: ExceptionConstants.ForbiddenCodes.FORBIDDEN,
      success: false,
    });
  };

  /**
   * A static method to generate an exception missing permissions error.
   * @param msg - An optional error message.
   * @returns An instance of the ForbiddenException class.
   */
  static MISSING_PERMISSIONS = (msg?: string) => {
    return new ForbiddenException({
      message: msg || 'You do not have permission to perform this action.',
      code: ExceptionConstants.ForbiddenCodes.MISSING_PERMISSIONS,
      success: false,
    });
  };
}
