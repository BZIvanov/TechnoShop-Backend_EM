const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');
const {
  getProductReviews,
  getMyProductReview,
  reviewProduct,
  getAggregatedProductReviews,
} = require('./review.controllers');

const router = express.Router();

router
  .route('/:productId')
  .get(getProductReviews)
  .post(authenticate, authorize(userRoles.buyer), reviewProduct);

router
  .route('/:productId/my-review')
  .get(authenticate, authorize(userRoles.buyer), getMyProductReview);

router.route('/:productId/summary').get(getAggregatedProductReviews);

module.exports = router;
