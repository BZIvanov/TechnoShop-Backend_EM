const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { environment } = require('../config/environment');

mongoose.connection.once('open', () => {
  console.log('Connected to Mongo DB');
});

mongoose.connection.on('error', (error) => {
  console.log('Mongo DB error', error);
});

let memoryServer = null;

const mongoDbConnect = async () => {
  let URI = environment.DATABASE_URI;

  if (environment.NODE_ENV === 'test') {
    memoryServer = await MongoMemoryServer.create();
    URI = memoryServer.getUri();
  }

  await mongoose.connect(URI);
};

const mongoDbDisconnect = async () => {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { mongoDbConnect, mongoDbDisconnect };
