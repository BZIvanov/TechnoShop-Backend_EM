const { Schema, model } = require('mongoose');

const {
  shopModel,
  shopActivityStatuses,
  shopPaymentStatuses,
} = require('./shop.constants');
const { userModel } = require('../user/user.constants');

const schema = new Schema(
  {
    user: {
      type: Schema.ObjectId,
      ref: userModel,
      required: true,
    },
    activityStatus: {
      type: String,
      enum: Object.values(shopActivityStatuses),
      default: shopActivityStatuses.active,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(shopPaymentStatuses),
      default: shopPaymentStatuses.unpaid,
    },
    shopInfo: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = model(shopModel, schema);
