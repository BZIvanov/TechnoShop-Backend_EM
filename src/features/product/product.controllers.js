const status = require('http-status');
const slugify = require('slugify');

const Product = require('./product.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');
const Subcategory = require('../subcategory/subcategory.model');
const cloudinary = require('../../providers/cloudinary');

const handleRating = (rating) =>
  Product.aggregate([
    {
      $project: {
        document: '$$ROOT',
        ceiledAverage: {
          $ceil: { $avg: '$ratings.stars' }, // calculate the average for all the product's ratings and store the value in prop ceiledAverage
        },
      },
    },
    { $match: { ceiledAverage: parseInt(rating, 10) } },
  ]);

const handleQueryParams = async (params) => {
  const {
    text,
    price,
    categories,
    subcategories,
    rating,
    shipping,
    category,
    subcategory,
  } = params;

  const aggregates = rating && (await handleRating(rating));

  const build = {
    ...(text && { $text: { $search: text } }), // this will work on fields with text property in the model
    ...(price && {
      price: {
        $gte: parseInt(price.split(',')[0], 10),
        $lte: parseInt(price.split(',')[1], 10),
      },
    }),
    ...(categories && { category: categories.split(',') }),
    ...(subcategories && {
      subcategories: { $in: subcategories.split(',') },
    }),
    ...(rating && { _id: aggregates }),
    ...(shipping && { shipping }),
    ...(category && { category }), // category from params will override categories from query
    ...(subcategory && { subcategories: subcategory }),
  };

  return build;
};

module.exports.getProducts = catchAsync(async (req, res) => {
  const { categoryId, subcategoryId } = req.params;

  let subcategory;
  if (subcategoryId) {
    subcategory = await Subcategory.findById(subcategoryId).exec();
  }

  const {
    sortColumn = 'createdAt',
    order = 'desc',
    page,
    perPage,
    ...rest
  } = req.query;

  const builder = await handleQueryParams({
    category: categoryId,
    subcategory,
    ...rest,
  });

  const pageNumber = parseInt(page || 1, 10);
  const perPageNumber = parseInt(perPage || 12, 10);

  const products = await Product.find(builder)
    .skip((pageNumber - 1) * perPageNumber)
    .limit(perPageNumber)
    .populate('category')
    .populate('subcategories')
    .sort([[sortColumn, order]]);

  const totalCount = await Product.where(builder).countDocuments();

  res.status(status.OK).json({ success: true, products, totalCount });
});

module.exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId)
    .populate('category')
    .populate('subcategories');

  if (!product) {
    return next(new AppError('Product not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, product });
});

module.exports.createProduct = catchAsync(async (req, res) => {
  req.body.slug = slugify(req.body.title);

  const product = await Product.create(req.body);

  res.status(status.CREATED).json({ success: true, product });
});

module.exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return next(new AppError('Product not found', status.NOT_FOUND));
  }

  res.status(status.OK).json({ success: true, product });
});

module.exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.productId);

  if (!product) {
    return next(new AppError('Product not found', status.NOT_FOUND));
  }

  product.images.forEach(async (image) => {
    await cloudinary.uploader.destroy(image.publicId);
  });

  res.status(status.NO_CONTENT).json();
});

module.exports.rateProduct = catchAsync(async (req, res) => {
  const { rating: userRating } = req.body;

  const product = await Product.findById(req.params.productId);

  const existingRatingObject = product.ratings.find(
    (rating) => rating.postedBy.toString() === req.user._id.toString(),
  );

  if (existingRatingObject) {
    await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { 'ratings.$.stars': userRating } },
      { new: true },
    );
  } else {
    await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { stars: userRating, postedBy: req.user._id } },
      },
      { new: true },
    );
  }

  const updatedProduct = await Product.findById(req.params.productId)
    .populate('category')
    .populate('subcategories');

  res.status(status.OK).json({ success: true, product: updatedProduct });
});

module.exports.getSimilarProducts = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError('Product not found', status.NOT_FOUND));
  }

  const PRODUCTS_COUNT = 3;

  const similarProducts = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
  })
    .limit(PRODUCTS_COUNT)
    .populate('category')
    .populate('subcategories');

  res.status(status.OK).json({
    success: true,
    products: similarProducts,
    totalCount: similarProducts.length,
  });
});
