const status = require('http-status');
const AppError = require('../utils/app-error');

// always keep all 4 parameters for this function or it will not fire
module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // mongoose error, for example invalid _id value type
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', status.NOT_FOUND);
  }

  // mongoose error
  if (err.code === 11000) {
    error = new AppError('Duplicate field value', status.BAD_REQUEST);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((value) => value.message);
    error = new AppError(message, status.BAD_REQUEST);
  }

  // jsonwebtoken error
  if (err.name === 'TokenExpiredError') {
    error = new AppError(error.message, status.UNAUTHORIZED);
  }

  res
    .status(error.statusCode || status.INTERNAL_SERVER_ERROR)
    .json({ success: false, error: error.message || 'Server error' });
};
