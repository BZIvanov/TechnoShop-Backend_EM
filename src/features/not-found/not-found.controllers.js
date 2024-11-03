const httpStatus = require('http-status');

const notFound = (req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: `${req.method} on route ${req.originalUrl} was not found.`,
  });
};

module.exports = {
  notFound,
};
