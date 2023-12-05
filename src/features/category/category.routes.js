const express = require('express');

const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('./category.controllers');
const validateRequestBody = require('../../middlewares/validate-request-body');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const {
  userTypes: { admin },
} = require('../user/user.constants');
const {
  upsertCategoryValidationSchema,
} = require('./category.validationSchema');

const router = express.Router();

router
  .route('/')
  .get(getAllCategories)
  .post(
    validateRequestBody(upsertCategoryValidationSchema),
    authenticate,
    authorize(admin),
    createCategory,
  );
router
  .route('/:id')
  .get(getCategory)
  .patch(
    validateRequestBody(upsertCategoryValidationSchema),
    authenticate,
    authorize(admin),
    updateCategory,
  )
  .delete(authenticate, authorize(admin), deleteCategory);

module.exports = router;
