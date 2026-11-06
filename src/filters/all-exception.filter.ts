import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiException } from '../exceptions/api.exception';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'unprocessable_entity',
  429: 'rate_limited',
};

/**
 * Catches every exception and answers with the same JSON shape:
 * `{ "error": "<message>" }`, as the assessment contract requires. Unknown errors are logged and
 * reported as a plain 500 without leaking internals.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const response = host.switchToHttp().getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'internal server error';

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      for (const [name, value] of Object.entries(exception.headers)) httpAdapter.setHeader(response, name, value);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = CODE_BY_STATUS[status] ?? 'error';
      message = status === 404 ? 'route not found' : exception.message;
    } else if (exception && typeof exception.status === 'number' && exception.status >= 400 && exception.status < 500) {
      // Errors raised by the body parser (malformed JSON, payload too large, ...).
      status = exception.status;
      code = status === 413 ? 'payload_too_large' : 'invalid_json';
      message = status === 413 ? 'request body is too large' : 'request body is not valid JSON';
    } else {
      this.logger.error(exception?.stack ?? exception);
    }

    httpAdapter.reply(response, { error: message }, status);
  }
}
