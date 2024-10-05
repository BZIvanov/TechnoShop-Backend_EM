const express = require('express');

const {
  getCoupons,
  createCoupon,
  deleteCoupon,
} = require('./coupon.controllers');
const validateRequestBody = require('../../middlewares/validate-request-body');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');
const { createCouponValidationSchema } = require('./coupon.validationSchema');

const router = express.Router();

// the below 2 middlewares will apply to all coupon routes
router.use(authenticate, authorize(userRoles.admin));

router
  .route('/')
  .get(getCoupons)
  .post(validateRequestBody(createCouponValidationSchema), createCoupon);

router.route('/:couponId').delete(deleteCoupon);

module.exports = router;
