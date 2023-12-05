const status = require('http-status');
const slugify = require('slugify');

const Category = require('./category.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

module.exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  res.status(status.OK).json({ success: true, categories });
});

module.exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, category });
});

module.exports.createCategory = catchAsync(async (req, res) => {
  const { name } = req.body;
  const category = await Category.create({ name, slug: slugify(name) });

  res.status(status.CREATED).json({ success: true, category });
});

module.exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, slug: slugify(name) },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    return next(new AppError('Category not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, category });
});

module.exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', status.NOT_FOUND));
  }

  res.status(status.NO_CONTENT).json();
});
