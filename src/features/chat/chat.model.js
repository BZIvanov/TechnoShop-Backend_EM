const { Schema, model } = require('mongoose');

const { chatModel, chatTypes } = require('./chat.constants');
const { userModel, userRoles } = require('../user/user.constants');

const schema = new Schema(
  {
    participants: [
      {
        user: {
          type: Schema.ObjectId,
          ref: userModel,
          required: true,
        },
        role: {
          type: String,
          enum: Object.values(userRoles),
          required: true,
        },
      },
    ],
    chatType: {
      type: String,
      enum: Object.values(chatTypes),
      default: chatTypes.buyerSeller,
    },
    mostRecentMessage: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = model(chatModel, schema);
