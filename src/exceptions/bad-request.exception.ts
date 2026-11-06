/**
 * A custom exception that represents a BadRequest error.
 */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { ExceptionConstants } from './exceptions.constants';
import { IException, IHttpBadRequestExceptionResponse } from './exceptions.interface';

export class BadRequestException extends HttpException {
  @ApiProperty({
    enum: ExceptionConstants.BadRequestCodes,
    description: 'A unique code identifying the error.',
    example: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
  })
  code: number;

  // @ApiHideProperty()
  // cause: Error;

  @ApiProperty({
    description: 'Message for the exception',
    example: 'Bad Request',
  })
  message: string;

  @ApiProperty({
    description: 'A description of the error message.',
    example: 'The input provided was invalid',
  })
  description: string;

  @ApiProperty({
    description: 'A request succeeds or fails.',
    example: false,
  })
  success: boolean;

  /**
   * Constructs a new BadRequestException object.
   * @param exception An object containing the exception details.
   *  - message: A string representing the error message.
   *  - code: A number representing internal status code which helpful in future for frontend
   */
  constructor(exception: IException) {
    super(exception.message, HttpStatus.BAD_REQUEST, {
      description: exception.description,
    });
    this.message = exception.message;
    this.code = exception.code || ExceptionConstants.BadRequestCodes.UNEXPECTED_ERROR;
    this.success = false;
  }

  /**
   * Set the Trace ID of the BadRequestException instance.
   * @param traceId A string representing the Trace ID.
   */
  setTraceId = (traceId: string) => {};

  /**
   * Generate an HTTP response body representing the BadRequestException instance.
   * @param message A string representing the message to include in the response body.
   * @returns An object representing the HTTP response body.
   */
  generateHttpResponseBody = (message?: string): IHttpBadRequestExceptionResponse => {
    return {
      code: this.code,
      message: message || this.message,
      success: false,
    };
  };

  /**
   * Returns a new instance of BadRequestException representing an HTTP Request Timeout error.
   * @returns An instance of BadRequestException representing the error.
   */
  static HTTP_REQUEST_TIMEOUT = () => {
    return new BadRequestException({
      message: 'HTTP Request Timeout',
      code: ExceptionConstants.BadRequestCodes.HTTP_REQUEST_TIMEOUT,
      success: false,
    });
  };
  // FIX: Modified UNAUTHORIZED_ACCESS to accept an optional message
  static UNAUTHORIZED_ACCESS = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Unauthorized access or insufficient permissions.', // Use provided msg or default
      code: ExceptionConstants.BadRequestCodes.UNAUTHORIZED_ACCESS,
      success: false,
    });
  };

  /**
   * Create a BadRequestException for when a resource already exists.
   * @param {string} [msg] - Optional message for the exception.
   * @returns {BadRequestException} - A BadRequestException with the appropriate error code and message.
   */
  static RESOURCE_ALREADY_EXISTS = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Resource Already Exists',
      code: ExceptionConstants.BadRequestCodes.RESOURCE_ALREADY_EXISTS,
      success: false,
    });
  };

  /**
   * Create a BadRequestException for when a resource is not found.
   * @param {string} [msg] - Optional message for the exception.
   * @returns {BadRequestException} - A BadRequestException with the appropriate error code and message.
   */
  static RESOURCE_NOT_FOUND = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Resource Not Found',
      code: ExceptionConstants.BadRequestCodes.RESOURCE_NOT_FOUND,
      success: false,
    });
  };

  /**
   * Returns a new instance of BadRequestException representing a Validation Error.
   * @param msg A string representing the error message.
   * @returns An instance of BadRequestException representing the error.
   */
  static VALIDATION_ERROR = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Validation Error',
      code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      success: false,
    });
  };

  /**
   * Returns a new instance of BadRequestException representing an Unexpected Error.
   * @param msg A string representing the error message.
   * @returns An instance of BadRequestException representing the error.
   */
  static UNEXPECTED = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Unexpected Error',
      code: ExceptionConstants.BadRequestCodes.UNEXPECTED_ERROR,
      success: false,
    });
  };

  /**
   * Returns a new instance of BadRequestException representing an Invalid Input.
   * @param msg A string representing the error message.
   * @returns An instance of BadRequestException representing the error.
   */
  static INVALID_INPUT = (msg?: string) => {
    return new BadRequestException({
      message: msg || 'Invalid Input',
      code: ExceptionConstants.BadRequestCodes.INVALID_INPUT,
      success: false,
    });
  };
}
