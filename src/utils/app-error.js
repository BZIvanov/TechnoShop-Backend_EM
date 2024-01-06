/**
 * Custom error class for handling application-specific errors.
 *
 * @class AppError
 * @extends Error
 *
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code associated with the error.
 * @param {boolean} isOperational - Indicates whether the error is operational or programming-related.
 */
class AppError extends Error {
  /**
   * Creates an instance of AppError.
   *
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code associated with the error.
   * @param {boolean} isOperational - Indicates whether the error is operational or programming-related.
   */
  constructor(message, statusCode, isOperational) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // TODO start using this

    // this method will provide us the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
