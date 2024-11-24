const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const {
  getChat,
  getChats,
  createChat,
  getChatMessages,
} = require('./chat.controllers');

const router = express.Router();

router.route('/').get(authenticate, getChats).post(authenticate, createChat);

router.route('/:receiverId').get(authenticate, getChat);

router.route('/:chatId/messages').get(authenticate, getChatMessages);

module.exports = router;
