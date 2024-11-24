const express = require('express');

const {
  getBuyerOrders,
  getSellerOrders,
  createBuyerOrder,
  updateOrderDeliveryStatus,
  getBuyerOrdersStats,
  getSellerOrdersStats,
} = require('./order.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');

const router = express.Router();

router
  .route('/')
  .get(
    authenticate,
    authorize(userRoles.buyer, userRoles.admin),
    getBuyerOrders,
  )
  .post(authenticate, authorize(userRoles.buyer), createBuyerOrder);

router
  .route('/stats')
  .get(
    authenticate,
    authorize(userRoles.buyer, userRoles.admin),
    getBuyerOrdersStats,
  );

router
  .route('/seller')
  .get(authenticate, authorize(userRoles.seller), getSellerOrders);

router
  .route('/seller/stats')
  .get(authenticate, authorize(userRoles.seller), getSellerOrdersStats);

router
  .route('/seller/:orderItemId')
  .patch(authenticate, authorize(userRoles.seller), updateOrderDeliveryStatus);

module.exports = router;
