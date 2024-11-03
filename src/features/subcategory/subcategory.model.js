const { Schema, model } = require('mongoose');
const { categoryModel } = require('../category/category.constants');
const { subcategoryModel } = require('./subcategory.constants');

const schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Subcategory name is required'],
      minlength: [2, 'Subcategory name is too short'],
      maxlength: [32, 'Subcategory name is too long'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    categoryId: {
      type: Schema.ObjectId,
      ref: categoryModel,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = model(subcategoryModel, schema);
