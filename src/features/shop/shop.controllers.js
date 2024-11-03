const httpStatus = require('http-status');

const Shop = require('./shop.model');
const AppError = require('../../utils/app-error');
const catchAsync = require('../../middlewares/catch-async');
const { shopActivityStatuses } = require('./shop.constants');

const getShopsQueryParams = (params) => {
  const { activitystatus } = params;

  const build = {
    ...(activitystatus && { activitystatus }),
  };

  return build;
};

const getShops = catchAsync(async (req, res, next) => {
  const {
    sortColumn = 'createdAt',
    order,
    page,
    perPage,
    activitystatus = shopActivityStatuses.pending,
  } = req.query;

  const builder = await getShopsQueryParams({ activitystatus });

  const pageNumber = parseInt(page, 10) || 1;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const shops = await Shop.find(builder)
    .skip((pageNumber - 1) * perPageNumber)
    .limit(perPageNumber)
    .populate('user', 'username email')
    .sort({ [sortColumn]: parseInt(order, 10) || -1 });

  const totalCount = await Shop.where(builder).countDocuments();

  res.status(httpStatus.OK).json({ success: true, shops, totalCount });
});

const getShop = catchAsync(async (req, res, next) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);

  if (!shop) {
    return next(new AppError('Shop not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, shop });
});

const getSellerShop = catchAsync(async (req, res, next) => {
  const shop = await Shop.findOne({ user: req.user._id });

  if (!shop) {
    return next(new AppError('Shop not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, shop });
});

module.exports = {
  getShops,
  getShop,
  getSellerShop,
};
