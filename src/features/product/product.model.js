const { Schema, model } = require('mongoose');
const { productModel, yesNo } = require('./product.constants');
const { shopModel } = require('../shop/shop.constants');
const { categoryModel } = require('../category/category.constants');
const { subcategoryModel } = require('../subcategory/subcategory.constants');

const schema = new Schema(
  {
    shop: {
      type: Schema.ObjectId,
      ref: shopModel,
    },
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
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
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
      required: [true, 'Please provide a brand name'],
      maxLength: [50, 'Product brand should be at most 50 characters'],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = model(productModel, schema);
