const http = require('http');
require('dotenv').config();

const { mongoDbConnect } = require('./src/db/mongo');
const getApp = require('./src/app/express');

const app = getApp();

const server = http.createServer(app);

const startServer = async () => {
  await mongoDbConnect();

  const PORT = process.env.PORT || 3100;

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
