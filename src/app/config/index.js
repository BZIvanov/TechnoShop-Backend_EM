const { environment } = require('../../config/environment');

module.exports.corsOptions = {
  origin: environment.FRONTEND_URL,
  credentials: true, // Important for allowing credentials (cookies) in the response
  exposedHeaders: ['Set-Cookie'],
};

module.exports.expressJson = {
  limit: '5mb',
};

module.exports.limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res, next, options) =>
    res
      .status(options.statusCode)
      .json({ success: false, error: options.message }),
};
