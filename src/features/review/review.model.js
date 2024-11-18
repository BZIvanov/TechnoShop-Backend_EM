const { Schema, model } = require('mongoose');

const { reviewModel } = require('./review.constants');
const { userModel } = require('../user/user.constants');
const { productModel } = require('../product/product.constants');

const schema = new Schema(
  {
    user: {
      type: Schema.ObjectId,
      ref: userModel,
      required: true,
    },
    product: {
      type: Schema.ObjectId,
      ref: productModel,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// Ensure a user can only leave one review per product
schema.index({ user: 1, product: 1 }, { unique: true });

module.exports = model(reviewModel, schema);
