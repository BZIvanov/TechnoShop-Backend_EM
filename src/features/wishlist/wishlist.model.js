const { Schema, model } = require('mongoose');

const { wishlistModel } = require('./wishlist.constants');
const { userModel } = require('../user/user.constants');
const { productModel } = require('../product/product.constants');

const schema = new Schema(
  {
    products: [
      {
        type: Schema.ObjectId,
        ref: productModel,
      },
    ],
    owner: {
      type: Schema.ObjectId,
      ref: userModel,
    },
  },
  { timestamps: true },
);

module.exports = model(wishlistModel, schema);
