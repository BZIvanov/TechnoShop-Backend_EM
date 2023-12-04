class AppError extends Error {
  constructor(message, statusCode, isOperational) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // TODO start using this

    // this method will provide us the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
