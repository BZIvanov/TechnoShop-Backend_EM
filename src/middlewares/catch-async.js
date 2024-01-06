/**
 * Wraps an asynchronous Express.js route handler with error handling.
 *
 * @param {Function} handler - The asynchronous route handler function.
 * @returns {Function} - A new function that handles errors and passes them to the next middleware.
 */
const catchAsync = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = catchAsync;
