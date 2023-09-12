import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const response: any = host.switchToHttp().getResponse<Response>();
    const status: number = exception.getStatus();

    status < 500
      ? this.logger.debug(`${response.status}: ${exception.stack}`)
      : this.logger.error(`${response.status}: ${exception.stack}`);
    response.status(status).json(exception.getResponse());
  }
}
