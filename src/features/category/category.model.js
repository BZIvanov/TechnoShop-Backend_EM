const { Schema, model } = require('mongoose');
const {
  model: { Category },
} = require('./category.constants');

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
  { timestamps: true }
);

module.exports = model(Category, schema);
