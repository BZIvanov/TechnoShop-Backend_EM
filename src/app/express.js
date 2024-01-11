const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { corsOptions, expressJson, limiterOptions } = require('./config');
const routesV1 = require('./versioning/v1');
const notFoundRoutes = require('../features/not-found/not-found.routes');
const globalError = require('../middlewares/global-error');

const getApp = (appConfig = {}) => {
  const config = {
    corsOptions,
    expressJson,
    limiterOptions,
    ...appConfig, // provide app config options or overrirde exisiting, usefull for the tests
  };

  const app = express();

  // helmet should be on top of middlewares chain, because we want it to be applied for all our routes
  app.use(helmet());
  app.use(cors(config.corsOptions));
  app.use(express.json(config.expressJson));
  // cookie parser middleware will attach the cookies to the request object
  app.use(cookieParser());
  app.use(rateLimit(config.limiterOptions));

  app.use('/v1', routesV1);
  app.use('*', notFoundRoutes);
  // globalError has to be the last route
  app.use(globalError);

  return app;
};

module.exports = getApp;
