const httpStatus = require('http-status');

const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const Coupon = require('../coupon/coupon.model');
const Product = require('../product/product.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');
const { userRoles } = require('../user/user.constants');

const getBuyerOrders = catchAsync(async (req, res) => {
  const { sortColumn = 'createdAt', order = 'desc', page, perPage } = req.query;

  const pageNumber = parseInt(page, 10) || 0;
  const perPageNumber = parseInt(perPage, 10) || 5;

  const builder = { buyer: req.user._id };
  if (req.user.role === userRoles.admin) {
    delete builder.buyer;
  }

  const orders = await Order.find(builder)
    .skip(pageNumber * perPageNumber)
    .limit(perPageNumber)
    .populate('coupon', 'name discount')
    .populate('buyer', '_id username')
    .populate('products.product', '_id title price')
    .sort([[sortColumn, order]])
    .exec();
  const totalCount = await Order.where(builder).countDocuments();

  res.status(httpStatus.OK).json({ success: true, orders, totalCount });
});

const createBuyerOrder = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  const { cart, address, coupon: couponName } = req.body;

  const orderData = {
    products: cart,
    deliveryAddress: address,
    coupon: undefined,
    buyer: currentUser._id,
    totalPrice: 0,
  };

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

  const products = await Product.find({
    _id: cart.map((cartProduct) => cartProduct.product),
  }).exec();

  const insufficientQuantityProduct = products.find((product) => {
    const currentCartProduct = cart.find(
      (cartProduct) => cartProduct.product === product._id.toString(),
    );

    return product.quantity < currentCartProduct.count;
  });

  if (insufficientQuantityProduct) {
    return next(
      new AppError('Insufficient product quantity', httpStatus.BAD_REQUEST),
    );
  }

  const totalPrice = products.reduce((acc, curr) => {
    const cartProduct = cart.find((cp) => cp.product === curr._id.toString());

    let tempPrice = curr.price * cartProduct.count;
    if (curr.discount > 0) {
      tempPrice -= curr.price * curr.discount;
    }

    return acc + tempPrice;
  }, 0);
  orderData.totalPrice = coupon
    ? totalPrice - totalPrice * (coupon.discount / 100)
    : totalPrice;

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
  orderData.products = orderData.products.map((orderProduct) => {
    const productShop = products.find(
      (product) => product._id.toString() === orderProduct.product,
    );
    return { ...orderProduct, shop: productShop.shop };
  });

  // create buyer order
  const order = await new Order(orderData).save();

  // create seller(s) order
  const sellersOrderProductsData = orderData.products.reduce(
    (accumulator, currentValue) => {
      const shopId = currentValue.shop.toString();

      if (!accumulator[shopId]) {
        accumulator[shopId] = [];
      }

      accumulator[shopId].push({
        product: currentValue.product,
        count: currentValue.count,
        shop: shopId,
      });

      return accumulator;
    },
    {},
  );

  Object.keys(sellersOrderProductsData).forEach(async (shopId) => {
    const sellerOrderTotalPrice = products
      .filter((product) => product.shop.toString() === shopId)
      .reduce((acc, curr) => {
        const cartProduct = orderData.products.find(
          (orderDataProduct) =>
            orderDataProduct.product === curr._id.toString() &&
            orderDataProduct.shop.toString() === curr.shop.toString(),
        );

        let tempPrice = curr.price * cartProduct.count;
        if (curr.discount > 0) {
          tempPrice -= curr.price * curr.discount;
        }

        return acc + tempPrice;
      }, 0);

    await new OrderItem({
      parentOrder: order._id,
      shop: shopId,
      products: sellersOrderProductsData[shopId],
      totalPrice: sellerOrderTotalPrice,
      deliveryAddress: address,
    }).save();
  });

  res
    .status(httpStatus.CREATED)
    .json({ success: true, message: 'Order created', order });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { deliveryStatus } = req.body;

  const order = await Order.findByIdAndUpdate(
    orderId,
    { deliveryStatus },
    { new: true },
  )
    .populate('coupon', 'name discount')
    .populate('buyer', '_id username')
    .populate('products.product', '_id title price')
    .exec();

  res.status(httpStatus.OK).json({ success: true, order });
});

module.exports = {
  getBuyerOrders,
  createBuyerOrder,
  updateOrderStatus,
};
