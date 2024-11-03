const { Schema, model } = require('mongoose');

const { couponModel } = require('./coupon.constants');

const schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Coupon name is required'],
      minlength: [2, 'Coupon name is too short'],
      maxlength: [20, 'Coupon name is too long'],
    },
    discount: {
      type: Number,
      requred: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = model(couponModel, schema);
