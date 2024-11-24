const chatSocket = require('../features/chat/chat.socket');

// better approach would be using Redis, but for this demo we will store users in memory
const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;

    if (userId) {
      activeUsers.set(userId, socket.id);

      // emit online status of this new user to all other clients
      io.emit('userStatus', { userId, status: 'online' });

      // emit the list of all currently online users to the newly connected user
      socket.emit('activeUsers', Array.from(activeUsers.keys()));
    }

    chatSocket(io, socket);

    socket.on('disconnect', () => {
      if (userId) {
        activeUsers.delete(userId);

        // emit offline status to all clients
        io.emit('userStatus', { userId, status: 'offline' });
      }
    });
  });
};
