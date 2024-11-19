const express = require('express');

const {
  getBuyerOrders,
  createBuyerOrder,
  updateOrderStatus,
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
  .route('/:orderId')
  .patch(authenticate, authorize(userRoles.admin), updateOrderStatus);

module.exports = router;
