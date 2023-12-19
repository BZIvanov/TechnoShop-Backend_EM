const status = require('http-status');
const slugify = require('slugify');

const Subcategory = require('./subcategory.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

module.exports.getSubcategories = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const subcategories = await Subcategory.find({
    ...(categoryId && { categoryId }),
  })
    .populate('categoryId')
    .sort({ createdAt: -1 });

  res.status(status.OK).json({ success: true, subcategories });
});

module.exports.getSubcategory = catchAsync(async (req, res, next) => {
  const subcategory = await Subcategory.findById(req.params.subcategoryId);

  if (!subcategory) {
    return next(new AppError('Subcategory not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, subcategory });
});

module.exports.createSubcategory = catchAsync(async (req, res) => {
  const { name, categoryId } = req.body;
  let subcategory = await Subcategory.create({
    name,
    categoryId,
    slug: slugify(name),
  });

  // important to populate here, because the frontend relies on this data
  subcategory = await subcategory.populate('categoryId');

  res.status(status.CREATED).json({ success: true, subcategory });
});

module.exports.updateSubcategory = catchAsync(async (req, res, next) => {
  const { name, categoryId } = req.body;

  const subcategory = await Subcategory.findByIdAndUpdate(
    req.params.subcategoryId,
    { name, categoryId, slug: slugify(name) },
    {
      new: true,
      runValidators: true,
    },
  ).populate('categoryId'); // important to populate here, because the frontend relies on this data

  if (!subcategory) {
    return next(new AppError('Subcategory not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, subcategory });
});

module.exports.deleteSubcategory = catchAsync(async (req, res, next) => {
  const subcategory = await Subcategory.findByIdAndDelete(
    req.params.subcategoryId,
  );

  if (!subcategory) {
    return next(new AppError('Subcategory not found', status.NOT_FOUND));
  }

  res.status(status.NO_CONTENT).json();
});
