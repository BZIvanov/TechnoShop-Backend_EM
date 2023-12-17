module.exports.corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true, // Important for allowing credentials (cookies) in the response
  exposedHeaders: ['Set-Cookie'],
};

module.exports.expressJson = {
  limit: '5mb',
};
