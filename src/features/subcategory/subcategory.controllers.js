const httpStatus = require('http-status');
const slugify = require('slugify');

const Subcategory = require('./subcategory.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

const getSubcategories = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const subcategories = await Subcategory.find({
    ...(categoryId && { categoryId }),
  })
    .populate('categoryId')
    .sort({ createdAt: -1 });

  res
    .status(httpStatus.OK)
    .json({ success: true, subcategories, totalCount: subcategories.length });
});

const getGroupedSubcategories = catchAsync(async (req, res) => {
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

  res.status(httpStatus.OK).json({ success: true, subcategories });
});

const getSubcategory = catchAsync(async (req, res, next) => {
  const { subcategoryId } = req.params;

  const subcategory = await Subcategory.findById(subcategoryId);

  if (!subcategory) {
    return next(new AppError('Subcategory not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, subcategory });
});

const createSubcategory = catchAsync(async (req, res) => {
  const { name, categoryId } = req.body;

  let subcategory = await Subcategory.create({
    name,
    categoryId,
    slug: slugify(name),
  });

  // important to populate here, because the frontend relies on this data
  subcategory = await subcategory.populate('categoryId');

  res.status(httpStatus.CREATED).json({ success: true, subcategory });
});

const updateSubcategory = catchAsync(async (req, res, next) => {
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
    return next(new AppError('Subcategory not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, subcategory });
});

const deleteSubcategory = catchAsync(async (req, res, next) => {
  const { subcategoryId } = req.params;

  const subcategory = await Subcategory.findByIdAndDelete(subcategoryId);

  if (!subcategory) {
    return next(new AppError('Subcategory not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.NO_CONTENT).json();
});

module.exports = {
  getSubcategories,
  getGroupedSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
