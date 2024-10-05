const httpStatus = require('http-status');
const AppError = require('../utils/app-error');

// always keep all 4 parameters for this function or it will not fire
module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // mongoose error, for example invalid _id value type
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', httpStatus.NOT_FOUND);
  }

  // mongoose error
  if (err.code === 11000) {
    error = new AppError('Duplicate field value', httpStatus.BAD_REQUEST);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((value) => value.message);
    error = new AppError(message, httpStatus.BAD_REQUEST);
  }

  // jsonwebtoken error
  if (err.name === 'TokenExpiredError') {
    error = new AppError(error.message, httpStatus.UNAUTHORIZED);
  }

  res
    .status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
    .json({ success: false, error: error.message || 'Server error' });
};
