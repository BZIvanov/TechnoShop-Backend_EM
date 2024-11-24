const Chat = require('./chat.model');
const Message = require('./message.model');

module.exports = (io, socket) => {
  socket.on('joinChat', async ({ chatId }) => {
    socket.join(chatId);
  });

  socket.on('sendMessage', async ({ chatId, senderId, content }) => {
    await Chat.findByIdAndUpdate(
      chatId,
      { mostRecentMessage: content },
      { runValidators: true },
    );

    const newMessage = new Message({
      chat: chatId,
      sender: senderId,
      content,
    });
    await newMessage.save();

    const message = await Message.findById(newMessage._id).populate(
      'sender',
      'avatar',
    );

    io.to(chatId).emit('newMessage', {
      _id: message._id,
      chat: message.chat,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
    });
  });
};
