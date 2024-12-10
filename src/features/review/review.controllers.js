const httpStatus = require('http-status');
const mongoose = require('mongoose');

const Product = require('../product/product.model');
const Review = require('./review.model');
const AppError = require('../../utils/app-error');
const catchAsync = require('../../middlewares/catch-async');

const getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { sortColumn = 'createdAt', order, page, perPage } = req.query;

  const builder = { product: productId };

  const pageNumber = parseInt(page, 10) || 0;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const reviews = await Review.find(builder)
    .skip(pageNumber * perPageNumber)
    .limit(perPageNumber)
    .populate('user', 'username')
    .sort({ [sortColumn]: parseInt(order, 10) || -1 });

  const totalCount = await Review.where(builder).countDocuments();

  res.status(httpStatus.OK).json({ success: true, reviews, totalCount });
});

const getMyProductReview = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const review = await Review.findOne({
    product: productId,
    user: req.user._id,
  });

  res.status(httpStatus.OK).json({ success: true, review });
});

const reviewProduct = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError('Product not found', httpStatus.NOT_FOUND));
  }

  let review = await Review.findOne({ user: userId, product: productId });

  if (review) {
    const oldRating = review.rating;

    review.rating = rating;
    review.comment = comment || '';
    await review.save();

    // update product's average rating (subtract the old rating, add the new one)
    product.averageRating =
      (product.averageRating * product.reviewCount - oldRating + rating) /
      product.reviewCount;
  } else {
    // if the review doesn't exist, create a new review
    review = new Review({
      user: userId,
      product: productId,
      rating,
      comment: comment || '',
    });
    await review.save();

    product.averageRating =
      (product.averageRating * product.reviewCount + rating) /
      (product.reviewCount + 1);
    product.reviewCount += 1;
  }

  await product.save();

  res.status(httpStatus.OK).json({ success: true, review });
});

const getAggregatedProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const reviewAggregation = await Review.aggregate([
    {
      $match: {
        product: mongoose.Types.ObjectId.createFromHexString(productId),
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    {
      $group: {
        _id: null, // We want the total average, so group everything together
        averageRating: { $avg: '$_id' },
        totalReviews: { $sum: '$count' },
        ratings: {
          $push: {
            rating: '$_id',
            count: '$count',
          },
        },
      },
    },
  ]);

  const aggregatedRatings = {
    5: { count: 0 },
    4: { count: 0 },
    3: { count: 0 },
    2: { count: 0 },
    1: { count: 0 },
  };

  (reviewAggregation[0]?.ratings || []).forEach((agg) => {
    aggregatedRatings[agg.rating] = { count: agg.count };
  });

  const reviewSummary =
    reviewAggregation.length > 0
      ? {
          averageRating: reviewAggregation[0].averageRating,
          totalReviews: reviewAggregation[0].totalReviews,
          ratings: aggregatedRatings,
        }
      : {
          averageRating: 0,
          totalReviews: 0,
          ratings: [],
        };

  res.status(httpStatus.OK).json({ success: true, review: reviewSummary });
});

module.exports = {
  getProductReviews,
  getMyProductReview,
  reviewProduct,
  getAggregatedProductReviews,
};
