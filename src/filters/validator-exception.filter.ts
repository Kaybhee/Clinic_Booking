import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationError } from 'class-validator';

import { BadRequestException } from '../exceptions/bad-request.exception';

/**
 * An exception filter to handle validation errors thrown by class-validator.
 */
@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Handle a validation error.
   * @param exception The validation error object.
   * @param host The arguments host object.
   */
  catch(exception: ValidationError, host: ArgumentsHost): void {
    this.logger.verbose(exception);
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
    const errorMsg = exception.constraints || (exception?.children && exception.children[0].constraints);

    const err = BadRequestException.VALIDATION_ERROR(Object.values(errorMsg || {})[0]);

    const responseBody = {
      error: err.code,
      message: err.message,
    };
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
