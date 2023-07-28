import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { TokenError } from 'passport-oauth2';
import { ErrorResponse } from 'src/common/types/error-response.interface';

@Catch(TokenError)
export class Passport42ExceptionFilter implements ExceptionFilter {
  catch(exception: TokenError, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response = ctx.getResponse();

    const errorResponse: ErrorResponse = {
      statusCode: 400,
      message:
        'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
    };

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
