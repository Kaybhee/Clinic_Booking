import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionConstants } from './exceptions.constants';
import { IException, IHttpInternalServerErrorExceptionResponse } from './exceptions.interface';

export class InternalServerErrorException extends HttpException {
  @ApiProperty({
    enum: ExceptionConstants.InternalServerErrorCodes,
    description: 'A unique code identifying the error.',
    example: ExceptionConstants.InternalServerErrorCodes.INTERNAL_SERVER_ERROR,
  })
  code: number;

  @ApiProperty({
    description: 'Message for the exception',
    example: 'An unexpected error occurred while processing your request.',
  })
  message: string;

  @ApiProperty({
    description: 'A description of the error message.',
    example: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
  })
  description: string;

  @ApiProperty({
    description: 'A request succeeds or fails.',
    example: false,
  })
  success: boolean;

  /**
   * Constructs a new InternalServerErrorException object.
   * @param exception An object containing the exception details.
   *  - message: A string representing the error message.
   *  - cause: An object representing the cause of the error.
   *  - description: A string describing the error in detail.
   *  - code: A number representing internal status code which helpful in future for frontend
   */
  constructor(exception: IException) {
    super(exception.message, HttpStatus.INTERNAL_SERVER_ERROR, {
      description: exception.description,
    });
    this.message = exception.message;
    this.description =
      exception.description ||
      'The server encountered an unexpected condition that prevented it from fulfilling the request. Please try again later.';
    this.code = exception.code || ExceptionConstants.InternalServerErrorCodes.UNEXPECTED_ERROR;
    this.success = false;
  }

  /**
   * Generate an HTTP response body representing the BadRequestException instance.
   * @param message A string representing the message to include in the response body.
   * @returns An object representing the HTTP response body.
   */
  generateHttpResponseBody = (message?: string): IHttpInternalServerErrorExceptionResponse => {
    return {
      code: this.code,
      message: message || this.message,
      success: false,
    };
  };

  /**
   * Returns a new instance of InternalServerErrorException with a standard error message and code
   * @param error Error object causing the exception
   * @returns A new instance of InternalServerErrorException
   */
  static INTERNAL_SERVER_ERROR = (error: any) => {
    return new InternalServerErrorException({
      message: 'We are sorry, something went wrong on our end. Please try again later or contact our support team for assistance.',
      code: ExceptionConstants.InternalServerErrorCodes.INTERNAL_SERVER_ERROR,
      success: false,
    });
  };

  /**
   * Returns a new instance of InternalServerErrorException with a custom error message and code
   * @param error Error object causing the exception
   * @returns A new instance of InternalServerErrorException
   */
  static UNEXPECTED_ERROR = (error: any) => {
    return new InternalServerErrorException({
      message: 'An unexpected error occurred while processing the request.',
      code: ExceptionConstants.InternalServerErrorCodes.UNEXPECTED_ERROR,
      success: false,
    });
  };
}
