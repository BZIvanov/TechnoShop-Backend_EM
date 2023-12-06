const { Schema, model } = require('mongoose');

const {
  model: { Wishlist },
} = require('./wishlist.constants');
const {
  model: { User },
} = require('../user/user.constants');
const {
  model: { Product },
} = require('../product/product.constants');

const schema = new Schema(
  {
    products: [
      {
        type: Schema.ObjectId,
        ref: Product,
      },
    ],
    owner: {
      type: Schema.ObjectId,
      ref: User,
    },
  },
  { timestamps: true },
);

module.exports = model(Wishlist, schema);
