const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const {
  getProductReviews,
  reviewProduct,
  getAggregatedProductReviews,
} = require('./review.controllers');

const router = express.Router();

router
  .route('/:productId')
  .get(getProductReviews)
  .post(authenticate, reviewProduct);

router.route('/:productId/summary').get(getAggregatedProductReviews);

module.exports = router;
