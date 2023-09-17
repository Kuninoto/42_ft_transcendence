/**
 * @description Interface used for typing error responses
 */
export interface ErrorResponse {
  /**
   * @description HTTP response status code 40x 50x
   * @example 404
   */
  statusCode: number;

  /**
   * @description Message describring the status code
   * @example 'Not found'
   */
  message: string;
}
