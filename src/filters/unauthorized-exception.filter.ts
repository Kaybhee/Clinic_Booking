import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { UnauthorizedException } from '../exceptions/unauthorized.exception';

/**
 * Exception filter to handle unauthorized exceptions
 */
@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnauthorizedExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Method to handle unauthorized exceptions
   * @param exception - The thrown unauthorized exception
   * @param host - The arguments host
   */
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    this.logger.warn(exception);
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const httpStatus = exception.getStatus();
    const request = ctx.getRequest();
    const responseBody = exception.generateHttpResponseBody();
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
