const status = require('http-status');

const Wishlist = require('./wishlist.model');
const catchAsync = require('../../middlewares/catch-async');

module.exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ owner: req.user._id })
    .populate('products')
    .exec();

  res
    .status(status.OK)
    .json({ success: true, products: (wishlist && wishlist.products) || [] });
});

module.exports.upsertWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ owner: req.user._id }).exec();

  if (!wishlist) {
    wishlist = await new Wishlist({ owner: req.user._id }).save();
  }

  const isExistingProduct = wishlist.products.includes(productId);

  const updateConfig = {
    ...(isExistingProduct && { $pull: { products: productId } }),
    ...(!isExistingProduct && { $addToSet: { products: productId } }),
  };

  const wishlistProducts = await Wishlist.findOneAndUpdate(
    { owner: req.user._id },
    updateConfig,
    { new: true },
  )
    .populate('products')
    .exec();

  res.status(status.OK).json({
    success: true,
    products: (wishlistProducts && wishlistProducts.products) || [],
  });
});
