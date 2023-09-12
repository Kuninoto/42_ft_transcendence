import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TokenError } from 'passport-oauth2';
import { ErrorResponse } from 'types';

const FT_API_ERROR_MSG =
  'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.';

@Catch(TokenError)
export class Passport42ExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger('Passport42');

  catch(exception: TokenError, host: ArgumentsHost): void {
    const response: any = host.switchToHttp().getResponse();

    const errorResponse: ErrorResponse = {
      message: FT_API_ERROR_MSG,
      statusCode: HttpStatus.BAD_REQUEST,
    };

    this.logger.warn('There was a misconfiguration on the 42 OAuth2 process');
    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
