const { Schema, model } = require('mongoose');
const { productModel, yesNo } = require('./product.constants');
const { userModel } = require('../user/user.constants');
const { categoryModel } = require('../category/category.constants');
const { subcategoryModel } = require('../subcategory/subcategory.constants');

const schema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'Product name is required'],
      minlength: [2, 'Product name is too short'],
      maxlength: [32, 'Product name is too long'],
      text: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 2000,
      text: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: Schema.ObjectId,
      ref: categoryModel,
    },
    subcategories: [
      {
        type: Schema.ObjectId,
        ref: subcategoryModel,
      },
    ],
    quantity: {
      type: Number,
    },
    sold: {
      type: Number,
      default: 0,
    },
    images: [
      {
        publicId: {
          type: String,
        },
        imageUrl: {
          type: String,
        },
      },
    ],
    shipping: {
      type: String,
      default: yesNo.yes,
      enum: Object.values(yesNo),
    },
    color: {
      type: String,
    },
    brand: {
      type: String,
    },
    ratings: [
      {
        stars: {
          type: Number,
        },
        postedBy: {
          type: Schema.ObjectId,
          ref: userModel,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = model(productModel, schema);
