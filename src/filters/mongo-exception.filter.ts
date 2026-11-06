import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Response } from 'express';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      if (exception.errmsg && exception.errmsg.includes('emailAddress')) {
        message = 'Email address has been used by another customer';
      } else {
        message = 'Duplicate key error';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
