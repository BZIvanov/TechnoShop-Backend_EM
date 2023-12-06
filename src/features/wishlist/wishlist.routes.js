const express = require('express');

const { getWishlist, upsertWishlist } = require('./wishlist.controllers');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

router.route('/').get(authenticate, getWishlist);

router.route('/:productId').post(authenticate, upsertWishlist);

module.exports = router;
