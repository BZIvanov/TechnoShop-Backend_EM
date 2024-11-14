const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');
const {
  getShops,
  getShop,
  getSellerShop,
  updateShopInfo,
  updatePaymentStatus,
} = require('./shop.controllers');

const router = express.Router();

router.route('/').get(authenticate, authorize(userRoles.admin), getShops);

router
  .route('/seller')
  .get(authenticate, authorize(userRoles.seller), getSellerShop)
  .patch(authenticate, authorize(userRoles.seller), updateShopInfo);

router
  .route('/seller/payment')
  .patch(authenticate, authorize(userRoles.seller), updatePaymentStatus);

router.route('/:shopId').get(authenticate, authorize(userRoles.admin), getShop);

module.exports = router;
