const express = require('express');

const {
  getBuyerOrders,
  getAdminOrders,
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
  .get(authenticate, authorize(userRoles.buyer), getBuyerOrders)
  .post(authenticate, authorize(userRoles.buyer), createBuyerOrder);

// the buyer order plus the seller order items
router
  .route('/admin')
  .get(authenticate, authorize(userRoles.admin), getAdminOrders);

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
