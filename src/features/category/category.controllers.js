const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

const cloudinary = require('../../providers/cloudinary');
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

const createCategory = catchAsync(async (req, res, next) => {
  const { categoryName } = req.body;
  const categoryImage = req.file;

  if (!categoryImage) {
    return next(
      new AppError('Category image was not provided', httpStatus.BAD_REQUEST),
    );
  }

  const existingCategory = await Category.findOne({ name: categoryName });
  if (existingCategory) {
    return next(
      new AppError('Category name already exists', httpStatus.BAD_REQUEST),
    );
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: uuidv4(),
        resource_type: 'auto',
        folder: 'categories',
      },
      (uploadError, uploadCb) => {
        if (uploadError) {
          reject(uploadError);
        } else {
          resolve(uploadCb);
        }
      },
    );

    uploadStream.end(req.file.buffer);
  });

  const category = await Category.create({
    name: categoryName,
    slug: slugify(categoryName),
    image: {
      publicId: uploadResult.public_id,
      imageUrl: uploadResult.secure_url,
    },
  });

  res
    .status(httpStatus.CREATED)
    .json({ success: true, message: 'Category created', category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { categoryName } = req.body;
  const categoryImage = req.file;

  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new AppError('Category not found', httpStatus.NOT_FOUND));
  }

  let uploadResult;
  if (categoryImage) {
    const { result: removeResult } = await cloudinary.uploader.destroy(
      category.image.publicId,
    );

    if (removeResult !== 'ok') {
      return next(
        new AppError(
          'Remove category image error',
          httpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: uuidv4(),
          resource_type: 'auto',
          folder: 'categories',
        },
        (uploadError, uploadCb) => {
          if (uploadError) {
            reject(uploadError);
          } else {
            resolve(uploadCb);
          }
        },
      );

      uploadStream.end(req.file.buffer);
    });
  }

  const updateCategoryData = {
    name: categoryName || category.name,
    slug: slugify(categoryName || category.name),
  };

  if (uploadResult) {
    updateCategoryData.image = {
      publicId: uploadResult.public_id,
      imageUrl: uploadResult.secure_url,
    };
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    updateCategoryData,
    { new: true, runValidators: true },
  );

  res.status(httpStatus.OK).json({ success: true, category: updatedCategory });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new AppError('Category not found', httpStatus.NOT_FOUND));
  }

  const { result: removeResult } = await cloudinary.uploader.destroy(
    category.image.publicId,
  );

  // allow 'not found' result for the seeded data
  if (removeResult !== 'ok' && removeResult !== 'not found') {
    return next(
      new AppError(
        'Remove category image error',
        httpStatus.INTERNAL_SERVER_ERROR,
      ),
    );
  }

  await Category.findByIdAndDelete(categoryId);

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
