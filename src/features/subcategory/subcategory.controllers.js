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

module.exports.getGroupedSubcategories = catchAsync(async (req, res) => {
  const subcategories = await Subcategory.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $sort: {
        categoryName: -1,
      },
    },
    {
      $group: {
        _id: '$categoryId',
        categoryName: { $first: '$category.name' },
        subcategories: { $push: '$$ROOT' },
      },
    },
    {
      $sort: {
        categoryName: 1,
      },
    },
    {
      $project: {
        _id: 1,
        categoryName: 1,
        subcategories: {
          $map: {
            input: '$subcategories',
            as: 'subcategory',
            in: {
              _id: '$$subcategory._id',
              name: '$$subcategory.name',
              slug: '$$subcategory.slug',
              categoryId: '$$subcategory.categoryId',
              createdAt: '$$subcategory.createdAt',
              updatedAt: '$$subcategory.updatedAt',
              __v: '$$subcategory.__v',
            },
          },
        },
      },
    },
  ]);

  res.status(status.OK).json({ success: true, subcategories });
});

module.exports.getSubcategory = catchAsync(async (req, res, next) => {
  const { subcategoryId } = req.params;

  const subcategory = await Subcategory.findById(subcategoryId);

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
  const { subcategoryId } = req.params;
  const { name, categoryId } = req.body;

  const subcategory = await Subcategory.findByIdAndUpdate(
    subcategoryId,
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
  const { subcategoryId } = req.params;

  const subcategory = await Subcategory.findByIdAndDelete(subcategoryId);

  if (!subcategory) {
    return next(new AppError('Subcategory not found', status.NOT_FOUND));
  }

  res.status(status.NO_CONTENT).json();
});
