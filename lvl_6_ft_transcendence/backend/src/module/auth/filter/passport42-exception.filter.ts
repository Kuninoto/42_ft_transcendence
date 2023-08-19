import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { TokenError } from 'passport-oauth2';
import { ErrorResponse } from 'types';

@Catch(TokenError)
export class Passport42ExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger();

  catch(exception: TokenError, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response = ctx.getResponse();

    const errorResponse: ErrorResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      message:
        'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
    };

    this.logger.warn('There was a misconfiguration on the 42 OAuth2 process');
    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
