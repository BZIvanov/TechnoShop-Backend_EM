const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

mongoose.connection.once('open', () => {
  console.log('Connected to Mongo DB');
});

mongoose.connection.on('error', (error) => {
  console.log('Mongo DB error', error);
});

let memoryServer = null;

const mongoDbConnect = async () => {
  let { DATABASE_URI } = process.env;

  if (process.env.NODE_ENV === 'test') {
    memoryServer = await MongoMemoryServer.create();
    DATABASE_URI = memoryServer.getUri();
  }

  await mongoose.connect(DATABASE_URI);
};

const mongoDbDisconnect = async () => {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { mongoDbConnect, mongoDbDisconnect };
