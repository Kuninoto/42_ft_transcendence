import { ErrorResponse } from '../types/error-response.interface';

export class ErrorResponseDTO implements ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
