const status = require('http-status');
const slugify = require('slugify');

const Category = require('./category.model');
const catchAsync = require('../../middlewares/catch-async');

module.exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  res.status(status.OK).json({ success: true, categories });
});

module.exports.createCategory = catchAsync(async (req, res) => {
  const { name } = req.body;
  const category = await Category.create({ name, slug: slugify(name) });

  res.status(status.CREATED).json({ success: true, category });
});
