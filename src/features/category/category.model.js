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
    image: {
      publicId: {
        type: String,
        required: [true, 'Please provide a public ID for the image'],
      },
      imageUrl: {
        type: String,
        required: [true, 'Please provide an image URL'],
        maxLength: [200, 'Category image should be at most 200 characters'],
      },
    },
  },
  { timestamps: true },
);

module.exports = model(categoryModel, schema);
