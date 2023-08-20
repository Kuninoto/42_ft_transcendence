/**
 * @description Interface used for typing error responses
 */
export interface ErrorResponse {
	/**
	 * Message describring the status code
	 * @example Not found
	 */
	message: string

	/**
	 * HTTP response status code 40x 50x
	 * @example 404
	 */
	statusCode: number
}
