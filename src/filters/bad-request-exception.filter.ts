import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { BadRequestException } from '../exceptions/bad-request.exception';

/**
 * A filter to handle `BadRequestException`.
 */
@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BadRequestException.name);

  /**
   * Constructs a new instance of `BadRequestExceptionFilter`.
   * @param httpAdapterHost - The HttpAdapterHost instance to be used.
   */
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Handles the `BadRequestException` and transforms it into a JSON response.
   * @param exception - The `BadRequestException` instance that was thrown.
   * @param host - The `ArgumentsHost` instance that represents the current execution context.
   */
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    this.logger.verbose(exception);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus = exception.getStatus();
    const request = ctx.getRequest();

    const responseBody = exception.generateHttpResponseBody();

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
