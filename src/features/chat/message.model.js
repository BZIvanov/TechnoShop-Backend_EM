const { Schema, model } = require('mongoose');

const { chatModel, messageModel } = require('./chat.constants');
const { userModel } = require('../user/user.constants');

const schema = new Schema(
  {
    chat: {
      type: Schema.ObjectId,
      ref: chatModel,
      required: true,
    },
    sender: {
      type: Schema.ObjectId,
      ref: userModel,
      required: true,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = model(messageModel, schema);
