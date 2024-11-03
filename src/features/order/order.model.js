const { Schema, model } = require('mongoose');

const { orderModel, orderStatuses } = require('./order.constants');
const { productModel } = require('../product/product.constants');
const { userModel } = require('../user/user.constants');
const { couponModel } = require('../coupon/coupon.constants');

const schema = new Schema(
  {
    products: [
      {
        product: {
          type: Schema.ObjectId,
          ref: productModel,
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
      ref: couponModel,
    },
    orderedBy: {
      type: Schema.ObjectId,
      ref: userModel,
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

module.exports = model(orderModel, schema);
