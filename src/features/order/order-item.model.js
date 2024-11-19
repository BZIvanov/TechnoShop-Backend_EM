const { Schema, model } = require('mongoose');

const {
  orderModel,
  orderItemModel,
  orderItemDeliveryStatuses,
  orderItemPaymentStatuses,
} = require('./order.constants');
const { shopModel } = require('../shop/shop.constants');
const { couponModel } = require('../coupon/coupon.constants');
const Product = require('../product/product.model');

const schema = new Schema(
  {
    parentOrder: {
      type: Schema.ObjectId,
      ref: orderModel,
    },
    shop: {
      type: Schema.ObjectId,
      ref: shopModel,
    },
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
    totalPrice: {
      type: Number,
    },
    deliveryStatus: {
      type: String,
      default: orderItemDeliveryStatuses.PENDING,
      enum: Object.values(orderItemDeliveryStatuses),
    },
    paymentStatus: {
      type: String,
      default: orderItemPaymentStatuses.PENDING,
      enum: Object.values(orderItemPaymentStatuses),
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

module.exports = model(orderItemModel, schema);
