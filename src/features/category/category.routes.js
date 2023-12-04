const express = require('express');

const { getAllCategories, createCategory } = require('./category.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const {
  userTypes: { admin },
} = require('../user/user.constants');

const router = express.Router();

router
  .route('/')
  .get(getAllCategories)
  .post(authenticate, authorize(admin), createCategory);

module.exports = router;
