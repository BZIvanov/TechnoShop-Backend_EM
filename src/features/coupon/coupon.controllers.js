const status = require('http-status');

const Coupon = require('./coupon.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

module.exports.getCoupons = catchAsync(async (req, res) => {
  const { sortColumn = 'createdAt', order = 'desc', page, perPage } = req.query;

  const pageNumber = parseInt(page, 10) || 0;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const coupons = await Coupon.find()
    .skip(pageNumber * perPageNumber)
    .limit(perPageNumber)
    .sort([[sortColumn, order]])
    .exec();
  const totalCount = await Coupon.countDocuments();

  res.status(status.OK).json({ success: true, coupons, totalCount });
});

module.exports.createCoupon = catchAsync(async (req, res) => {
  const coupon = await new Coupon(req.body).save();

  res.status(status.CREATED).json({ success: true, coupon });
});

module.exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const { couponId } = req.params;

  const coupon = await Coupon.findByIdAndDelete(couponId).exec();

  if (!coupon) {
    return next(new AppError('Coupon not found', status.NOT_FOUND));
  }

  res.status(status.NO_CONTENT).json();
});
