const express = require('express');

const {
  getOrders,
  createOrder,
  updateOrderStatus,
} = require('./order.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');

const router = express.Router();

router.route('/').get(authenticate, getOrders).post(authenticate, createOrder);

router
  .route('/:orderId')
  .patch(authenticate, authorize(userRoles.admin), updateOrderStatus);

module.exports = router;
