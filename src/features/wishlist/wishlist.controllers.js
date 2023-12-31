const status = require('http-status');

const Wishlist = require('./wishlist.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

module.exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ owner: req.user._id })
    .populate('products')
    .exec();

  res
    .status(status.OK)
    .json({ success: true, products: (wishlist && wishlist.products) || [] });
});

module.exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ owner: req.user._id }).exec();

  if (!wishlist) {
    wishlist = await new Wishlist({ owner: req.user._id }).save();
  }

  const isExistingProduct = wishlist.products.includes(productId);

  if (isExistingProduct) {
    return next(
      new AppError(
        'This product is already on the wishlist',
        status.BAD_REQUEST,
      ),
    );
  }

  const wishlistProducts = await Wishlist.findOneAndUpdate(
    { owner: req.user._id },
    { $addToSet: { products: productId } },
    { new: true },
  )
    .populate('products')
    .exec();

  res.status(status.OK).json({
    success: true,
    products: wishlistProducts.products,
  });
});

module.exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ owner: req.user._id }).exec();

  if (!wishlist) {
    return next(new AppError('Wishlist not found', status.NOT_FOUND));
  }

  const isExistingProduct = wishlist.products.includes(productId);

  if (!isExistingProduct) {
    return next(
      new AppError('This product is not on the wishlist', status.BAD_REQUEST),
    );
  }

  const wishlistProducts = await Wishlist.findOneAndUpdate(
    { owner: req.user._id },
    { $pull: { products: productId } },
    { new: true },
  )
    .populate('products')
    .exec();

  res.status(status.OK).json({
    success: true,
    products: wishlistProducts.products,
  });
});
