const { Schema, model } = require('mongoose');

const {
  model: { Order },
  orderStatuses,
} = require('./order.constants');
const {
  model: { Product },
} = require('../product/product.constants');
const {
  model: { User },
} = require('../user/user.constants');
const {
  model: { Coupon },
} = require('../coupon/coupon.constants');

const schema = new Schema(
  {
    products: [
      {
        product: {
          type: Schema.ObjectId,
          ref: Product,
        },
        count: {
          type: Number,
        },
      },
    ],
    orderStatus: {
      type: String,
      default: orderStatuses.NOT_PROCESSED,
      enum: Object.values(orderStatuses),
    },
    coupon: {
      type: Schema.ObjectId,
      ref: Coupon,
    },
    orderedBy: {
      type: Schema.ObjectId,
      ref: User,
    },
    deliveryAddress: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = model(Order, schema);
