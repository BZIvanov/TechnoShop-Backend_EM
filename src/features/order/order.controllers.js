const httpStatus = require('http-status');

const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const Coupon = require('../coupon/coupon.model');
const Product = require('../product/product.model');
const Shop = require('../shop/shop.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');
const { userRoles } = require('../user/user.constants');
const {
  orderDeliveryStatuses,
  orderItemDeliveryStatuses,
  orderPaymentStatuses,
} = require('./order.constants');

const getBuyerOrdersQueryParams = (params) => {
  const { buyer, deliveryStatus } = params;

  const build = {
    buyer,
    ...(deliveryStatus && { deliveryStatus }),
  };

  return build;
};

const getBuyerOrders = catchAsync(async (req, res) => {
  const {
    sortColumn = 'createdAt',
    sortOrder,
    page,
    perPage,
    deliveryStatus,
  } = req.query;

  const pageNumber = parseInt(page, 10) || 0;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const builder = await getBuyerOrdersQueryParams({
    buyer: req.user._id,
    deliveryStatus,
  });

  if (req.user.role === userRoles.admin) {
    delete builder.buyer;

    // use aggragation, because for the admin we want to display the main order and all seller order items included
    const orders = await Order.aggregate([
      { $match: builder }, // Match based on admin's filter criteria
      {
        $lookup: {
          from: 'orderitems', // Join OrderItems based on parentOrder
          localField: '_id',
          foreignField: 'parentOrder',
          as: 'orderItems',
        },
      },
      {
        $lookup: {
          from: 'shops', // Join shops to enrich orderItems with shop details
          localField: 'orderItems.shop',
          foreignField: '_id',
          as: 'shopDetails',
        },
      },
      {
        $lookup: {
          from: 'products', // Join products to enrich orderItems.products with product details
          localField: 'orderItems.products.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: 'users', // Join users to enrich buyer info
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyer',
        },
      },
      {
        $lookup: {
          from: 'coupons',
          localField: 'coupon',
          foreignField: '_id',
          as: 'couponDetails',
        },
      },
      {
        $unwind: {
          path: '$buyer', // Unwind buyer array
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          orderItems: {
            $map: {
              input: '$orderItems',
              as: 'orderItem',
              in: {
                _id: '$$orderItem._id',
                shop: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$shopDetails',
                        as: 'shop',
                        cond: { $eq: ['$$shop._id', '$$orderItem.shop'] },
                      },
                    },
                    0,
                  ],
                },
                products: {
                  $map: {
                    input: '$$orderItem.products',
                    as: 'product',
                    in: {
                      product: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$productDetails',
                              as: 'productDetail',
                              cond: {
                                $eq: [
                                  '$$productDetail._id',
                                  '$$product.product',
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                      count: '$$product.count',
                    },
                  },
                },
                totalPrice: '$$orderItem.totalPrice',
                deliveryStatus: '$$orderItem.deliveryStatus',
                paymentStatus: '$$orderItem.paymentStatus',
                deliveryAddress: '$$orderItem.deliveryAddress',
                createdAt: '$$orderItem.createdAt',
                updatedAt: '$$orderItem.updatedAt',
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          buyer: { _id: 1, username: 1 },
          products: 1,
          totalPrice: 1,
          deliveryStatus: 1,
          paymentStatus: 1,
          deliveryAddress: 1,
          createdAt: 1,
          updatedAt: 1,
          orderItems: 1, // Include enriched orderItems
          couponDetails: 1,
        },
      },
      { $sort: { [sortColumn]: parseInt(sortOrder, 10) || -1 } },
      { $skip: pageNumber * perPageNumber },
      { $limit: perPageNumber },
    ]);

    const totalCount = await Order.countDocuments(builder);

    res.status(httpStatus.OK).json({ success: true, orders, totalCount });
  } else {
    const orders = await Order.find(builder)
      .skip(pageNumber * perPageNumber)
      .limit(perPageNumber)
      .populate('coupon', 'name discount')
      .populate('buyer', '_id username')
      .populate('products.product', '_id title price')
      .populate('products.shop', 'shopInfo')
      .sort([[sortColumn, parseInt(sortOrder, 10) || -1]])
      .exec();

    const totalCount = await Order.where(builder).countDocuments();

    res.status(httpStatus.OK).json({ success: true, orders, totalCount });
  }
});

const getSellerOrdersQueryParams = (params) => {
  const { shop, deliveryStatus } = params;

  const build = {
    shop,
    ...(deliveryStatus && { deliveryStatus }),
  };

  return build;
};

const getSellerOrders = catchAsync(async (req, res) => {
  const {
    sortColumn = 'createdAt',
    sortOrder,
    page,
    perPage,
    deliveryStatus,
  } = req.query;

  const pageNumber = parseInt(page, 10) || 1;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const shop = await Shop.findOne({ user: req.user._id });

  const builder = await getSellerOrdersQueryParams({
    shop: shop._id,
    deliveryStatus,
  });

  const orders = await OrderItem.find(builder)
    .skip((pageNumber - 1) * perPageNumber)
    .limit(perPageNumber)
    .populate('coupon', 'name discount')
    .populate('products.product', '_id title price')
    .sort({ [sortColumn]: parseInt(sortOrder, 10) || -1 });

  const totalCount = await OrderItem.where(builder).countDocuments();

  res.status(httpStatus.OK).json({ success: true, orders, totalCount });
});

const createBuyerOrder = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  const { cart, address, coupon: couponName } = req.body;

  const originalProducts = await Product.find({
    _id: cart.map((cartProduct) => cartProduct.product),
  }).exec();

  const insufficientQuantityProduct = originalProducts.find(
    (originalProduct) => {
      const currentCartProduct = cart.find(
        (cartProduct) => cartProduct.product === originalProduct._id.toString(),
      );

      return originalProduct.quantity < currentCartProduct.count;
    },
  );
  if (insufficientQuantityProduct) {
    return next(
      new AppError('Insufficient product quantity', httpStatus.BAD_REQUEST),
    );
  }

  const orderData = {
    products: [],
    deliveryAddress: address,
    coupon: undefined,
    buyer: currentUser._id,
    totalPrice: 0,
    paymentStatus: orderPaymentStatuses.PAID,
  };

  // check for coupon validity and assign value if valid
  const coupon = await Coupon.findOne({ name: couponName });
  if (coupon) {
    const currentDateTime = new Date();
    const expirationDateTime = new Date(coupon.expirationDate);

    if (currentDateTime > expirationDateTime) {
      return next(
        new AppError(
          'This coupon has already expired.',
          httpStatus.BAD_REQUEST,
        ),
      );
    }

    orderData.coupon = coupon._id;
  }

  // calculate total buyer order price based on the original products
  const totalBuyerOrderPrice = originalProducts.reduce((acc, curr) => {
    const cartProduct = cart.find((cp) => cp.product === curr._id.toString());

    let tempPrice = curr.price * cartProduct.count;
    if (curr.discount > 0) {
      tempPrice -= tempPrice * (curr.discount / 100);
    }

    return acc + tempPrice;
  }, 0);
  orderData.totalPrice = coupon
    ? totalBuyerOrderPrice - totalBuyerOrderPrice * (coupon.discount / 100)
    : totalBuyerOrderPrice;

  // update quantity and sold values for each product
  const bulkOption = cart.map((cartProduct) => ({
    updateOne: {
      filter: { _id: cartProduct.product },
      update: {
        $inc: { quantity: -cartProduct.count, sold: +cartProduct.count },
      },
    },
  }));
  await Product.bulkWrite(bulkOption, {});

  // assign product's shop to the orders products
  orderData.products = cart.map((cartProduct) => {
    const productShop = originalProducts.find(
      (originalProduct) =>
        originalProduct._id.toString() === cartProduct.product,
    );
    return { ...cartProduct, shop: productShop.shop.toString() };
  });

  // create buyer order
  const order = await new Order(orderData).save();

  // create seller(s) orders
  const sellersOrderProductsData = orderData.products.reduce(
    (accumulator, currentValue) => {
      if (!accumulator[currentValue.shop]) {
        accumulator[currentValue.shop] = [];
      }

      accumulator[currentValue.shop].push({
        product: currentValue.product,
        count: currentValue.count,
        shop: currentValue.shop,
      });

      return accumulator;
    },
    {},
  );

  Object.keys(sellersOrderProductsData).forEach(async (shopId) => {
    const sellerOrderTotalPrice = originalProducts
      .filter((originalProduct) => originalProduct.shop.toString() === shopId)
      .reduce((acc, curr) => {
        const cartProduct = orderData.products.find(
          (orderDataProduct) =>
            orderDataProduct.product === curr._id.toString(),
        );

        let tempPrice = curr.price * cartProduct.count;
        if (curr.discount > 0) {
          tempPrice -= tempPrice * (curr.discount / 100);
        }

        return acc + tempPrice;
      }, 0);

    await new OrderItem({
      parentOrder: order._id,
      shop: shopId,
      products: sellersOrderProductsData[shopId],
      totalPrice: coupon
        ? sellerOrderTotalPrice -
          sellerOrderTotalPrice * (coupon.discount / 100)
        : sellerOrderTotalPrice,
      deliveryAddress: address,
      paymentStatus: orderPaymentStatuses.PAID,
      coupon: order.coupon,
    }).save();
  });

  res
    .status(httpStatus.CREATED)
    .json({ success: true, message: 'Order created', order });
});

const updateOrderDeliveryStatus = catchAsync(async (req, res, next) => {
  const { orderItemId } = req.params;
  const { deliveryStatus } = req.body;

  const orderItem = await OrderItem.findById(orderItemId);

  if (!orderItem) {
    return next(new AppError('Order item not found', httpStatus.NOT_FOUND));
  }

  orderItem.deliveryStatus = deliveryStatus;
  await orderItem.save();

  const allOrderItems = await OrderItem.find({
    parentOrder: orderItem.parentOrder,
  });

  const allDelivered = allOrderItems.every(
    (item) => item.deliveryStatus === orderDeliveryStatuses.DELIVERED,
  );
  const allCanceled = allOrderItems.every(
    (item) => item.deliveryStatus === orderDeliveryStatuses.CANCELED,
  );

  let newParentOrderStatus;
  if (deliveryStatus === orderItemDeliveryStatuses.DELIVERED) {
    newParentOrderStatus = allDelivered
      ? orderDeliveryStatuses.DELIVERED
      : orderDeliveryStatuses.PARTIALLY_DELIVERED;
  } else if (deliveryStatus === orderItemDeliveryStatuses.CANCELED) {
    newParentOrderStatus = allCanceled
      ? orderDeliveryStatuses.CANCELED
      : orderDeliveryStatuses.PARTIALLY_CANCELED;
  }

  await Order.findByIdAndUpdate(orderItem.parentOrder, {
    deliveryStatus: newParentOrderStatus,
  });

  res.status(httpStatus.OK).json({ success: true, order: orderItem });
});

const getBuyerOrdersStats = catchAsync(async (req, res, next) => {
  const isBuyer = req.user.role === userRoles.buyer;

  const matchStage = isBuyer ? { $match: { buyer: req.user._id } } : {};

  const stats = await Order.aggregate([
    ...(isBuyer ? [matchStage] : []),
    {
      $group: {
        _id: '$deliveryStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
  const pendingOrders =
    stats.find((stat) => stat._id === orderDeliveryStatuses.PENDING)?.count ||
    0;
  const canceledOrders =
    stats.find((stat) => stat._id === orderDeliveryStatuses.CANCELED)?.count ||
    0;

  const totalOrderPriceResult = await Order.aggregate([
    ...(isBuyer ? [matchStage] : []),
    {
      $group: {
        _id: null,
        totalPrice: { $sum: '$totalPrice' },
      },
    },
  ]);
  const totalPrice =
    totalOrderPriceResult.length > 0 ? totalOrderPriceResult[0].totalPrice : 0;

  res.status(httpStatus.OK).json({
    success: true,
    totalOrders,
    pendingOrders,
    canceledOrders,
    totalPrice,
  });
});

const getSellerOrdersStats = catchAsync(async (req, res, next) => {
  const shop = await Shop.findOne({ user: req.user._id });

  if (!shop) {
    return next(new AppError('Shop not found', httpStatus.NOT_FOUND));
  }

  const matchStage = { $match: { shop: shop._id } };

  const stats = await OrderItem.aggregate([
    matchStage,
    {
      $group: {
        _id: '$deliveryStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
  const pendingOrders =
    stats.find((stat) => stat._id === orderItemDeliveryStatuses.PENDING)
      ?.count || 0;
  const canceledOrders =
    stats.find((stat) => stat._id === orderItemDeliveryStatuses.CANCELED)
      ?.count || 0;

  const totalOrderPriceResult = await OrderItem.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalPrice: { $sum: '$totalPrice' },
      },
    },
  ]);
  const totalPrice =
    totalOrderPriceResult.length > 0 ? totalOrderPriceResult[0].totalPrice : 0;

  res.status(httpStatus.OK).json({
    success: true,
    totalOrders,
    pendingOrders,
    canceledOrders,
    totalPrice,
  });
});

module.exports = {
  getBuyerOrders,
  getSellerOrders,
  createBuyerOrder,
  updateOrderDeliveryStatus,
  getBuyerOrdersStats,
  getSellerOrdersStats,
};
