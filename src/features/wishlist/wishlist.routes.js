const express = require('express');

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('./wishlist.controllers');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

router.route('/').get(authenticate, getWishlist);

router
  .route('/:productId')
  .post(authenticate, addToWishlist)
  .delete(authenticate, removeFromWishlist);

module.exports = router;
