import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';

/**
 * A filter to handle `InternalServerErrorException`.
 */
@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(InternalServerErrorException.name);

  /**
   * Constructs a new instance of `InternalServerErrorExceptionFilter`.
   * @param httpAdapterHost - The HttpAdapterHost instance to be used.
   */
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Handles the `InternalServerErrorException` and transforms it into a JSON response.
   * @param exception - The `InternalServerErrorException` instance that was thrown.
   * @param host - The `ArgumentsHost` instance that represents the current execution context.
   */
  catch(exception: InternalServerErrorException, host: ArgumentsHost): void {
    this.logger.error(exception);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const httpStatus = exception.getStatus();

    const request = ctx.getRequest();
    const responseBody = exception.generateHttpResponseBody();
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
