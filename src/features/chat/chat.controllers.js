const httpStatus = require('http-status');

const Chat = require('./chat.model');
const Message = require('./message.model');
const User = require('../user/user.model');
const AppError = require('../../utils/app-error');
const catchAsync = require('../../middlewares/catch-async');

const getChats = catchAsync(async (req, res) => {
  const { sortColumn = 'createdAt', order, perPageNumber } = req.query;

  const chats = await Chat.find({
    'participants.user': req.user._id,
  })
    .populate('participants.user', 'avatar username')
    .sort({ [sortColumn]: parseInt(order, 10) || -1 })
    .limit(perPageNumber); // TOOD: maybe limit or something like that is better variable name?

  res.status(httpStatus.OK).json({ success: true, chats });
});

const getChat = catchAsync(async (req, res) => {
  const { receiverId } = req.params;

  const chat = await Chat.findOne({
    participants: {
      $all: [
        { $elemMatch: { user: req.user._id } },
        { $elemMatch: { user: receiverId } },
      ],
    },
  }).populate('participants.user', 'avatar username');

  res.status(httpStatus.OK).json({ success: true, chat });
});

const createChat = catchAsync(async (req, res, next) => {
  const { receiverId } = req.body;

  const receiverUser = await User.findById(receiverId);

  if (!receiverUser) {
    return next(new AppError('Receiver not found', httpStatus.NOT_FOUND));
  }

  const existingChat = await Chat.findOne({
    participants: {
      $all: [
        { $elemMatch: { user: req.user._id } },
        { $elemMatch: { user: receiverId } },
      ],
    },
  });

  if (existingChat) {
    return next(new AppError('Chat already exists', httpStatus.BAD_REQUEST));
  }

  const chat = new Chat({
    participants: [
      { user: req.user._id, role: req.user.role },
      { user: receiverUser._id, role: receiverUser.role },
    ],
    messages: [],
  });
  await chat.save();

  res.status(httpStatus.CREATED).json({ success: true, chat });
});

const getChatMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.find({
    chat: chatId,
  }).populate('sender', 'avatar');

  res.status(httpStatus.OK).json({ success: true, messages });
});

module.exports = {
  getChats,
  getChat,
  createChat,
  getChatMessages,
};
