const { Schema, model } = require('mongoose');

const {
  orderModel,
  orderDeliveryStatuses,
  orderPaymentStatuses,
} = require('./order.constants');
const { productModel } = require('../product/product.constants');
const { userModel } = require('../user/user.constants');
const { couponModel } = require('../coupon/coupon.constants');
const { shopModel } = require('../shop/shop.constants');

const schema = new Schema(
  {
    buyer: {
      type: Schema.ObjectId,
      ref: userModel,
    },
    products: [
      {
        shop: {
          type: Schema.ObjectId,
          ref: shopModel,
        },
        product: {
          type: Schema.ObjectId,
          ref: productModel,
        },
        count: {
          type: Number,
        },
      },
    ],
    totalPrice: {
      type: Number,
    },
    deliveryStatus: {
      type: String,
      default: orderDeliveryStatuses.PENDING,
      enum: Object.values(orderDeliveryStatuses),
    },
    paymentStatus: {
      type: String,
      default: orderPaymentStatuses.PENDING,
      enum: Object.values(orderPaymentStatuses),
    },
    coupon: {
      type: Schema.ObjectId,
      ref: couponModel,
    },
    deliveryAddress: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = model(orderModel, schema);
