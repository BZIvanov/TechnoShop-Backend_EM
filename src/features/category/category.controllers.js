const httpStatus = require('http-status');
const slugify = require('slugify');

const Category = require('./category.model');
const Subcategory = require('../subcategory/subcategory.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  res.status(httpStatus.OK).json({ success: true, categories });
});

const getCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new AppError('Category not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, category });
});

const createCategory = catchAsync(async (req, res) => {
  const { name } = req.body;

  const category = await Category.create({ name, slug: slugify(name) });

  res.status(httpStatus.CREATED).json({ success: true, category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  const category = await Category.findByIdAndUpdate(
    categoryId,
    { name, slug: slugify(name) },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    return next(new AppError('Category not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, category });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) {
    return next(new AppError('Category not found', httpStatus.NOT_FOUND));
  }

  await Subcategory.deleteMany({ categoryId: category._id });

  res.status(httpStatus.NO_CONTENT).json();
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
