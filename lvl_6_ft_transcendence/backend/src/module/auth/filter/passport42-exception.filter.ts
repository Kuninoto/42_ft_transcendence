import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { TokenError } from 'passport-oauth2';
import { ErrorResponse } from 'src/common/types/error-response.interface';

@Catch(TokenError)
export class Passport42ExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger();

  catch(exception: TokenError, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response = ctx.getResponse();

    const errorResponse: ErrorResponse = {
      statusCode: 400,
      message:
        'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
    };

    this.logger.error('There was a misconfiguration on the 42 OAuth2 process');
    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
