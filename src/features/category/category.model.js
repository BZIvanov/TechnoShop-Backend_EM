const { Schema, model } = require('mongoose');
const { categoryModel } = require('./category.constants');

const schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Category name is required'],
      minlength: [2, 'Category name is too short'],
      maxlength: [32, 'Category name is too long'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = model(categoryModel, schema);
