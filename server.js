const http = require('http');

const { mongoDbConnect } = require('./src/db/mongo');
const getApp = require('./src/app/express');
const { ENV_VARS } = require('./src/config/environment');

const app = getApp();

const server = http.createServer(app);

const startServer = async () => {
  await mongoDbConnect();

  const PORT = ENV_VARS.PORT || 3100;

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();

process.on('uncaughtException', (error) => {
  console.log('Uncaught exception! Shutting down server and node...', error);

  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (error) => {
  console.log('Unhandled rejection! Shutting down server and node...', error);

  server.close(() => process.exit(1));
});
