require('dotenv').config(); // here the dotenv variables are also loaded, because of the unit tests
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { corsOptions, expressJson } = require('./config');
const routesV1 = require('./versioning/v1');
const notFoundRoutes = require('../features/not-found/not-found.routes');
const globalError = require('../middlewares/global-error');

const app = express();

// helmet should be on top of middlewares chain, because we want it to be applied for all our routes
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json(expressJson));
// cookie parser middleware will attach the cookies to the request object
app.use(cookieParser());

app.use('/v1', routesV1);
app.use('*', notFoundRoutes);
// globalError has to be the last route
app.use(globalError);

module.exports = app;
