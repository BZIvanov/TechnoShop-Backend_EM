const express = require('express');

const { uploadImage, removeImage } = require('./image.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const {
  userTypes: { admin },
} = require('../user/user.constants');

const router = express.Router();

router.route('/upload').post(authenticate, authorize(admin), uploadImage);
router.route('/remove').post(authenticate, authorize(admin), removeImage);

module.exports = router;
