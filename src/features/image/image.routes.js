const express = require('express');

const { uploadImage, removeImage } = require('./image.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');

const router = express.Router();

router
  .route('/upload')
  .post(authenticate, authorize(userRoles.admin), uploadImage);
router
  .route('/remove')
  .post(authenticate, authorize(userRoles.admin), removeImage);

module.exports = router;
