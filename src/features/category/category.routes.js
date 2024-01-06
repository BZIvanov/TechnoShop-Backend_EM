const express = require('express');

const {
  getCategories,
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
const subcategoryRoutes = require('../subcategory/subcategory.routes');
const productRoutes = require('../product/product.routes');

const router = express.Router();

// /v1/categories/:categoryId/subcategories => this will go to subcategories router where it will be just '/' with the same method
router.use('/:categoryId/subcategories', subcategoryRoutes);

router.use('/:categoryId/products', productRoutes);

router
  .route('/')
  .get(getCategories)
  .post(
    validateRequestBody(upsertCategoryValidationSchema),
    authenticate,
    authorize(admin),
    createCategory,
  );
router
  .route('/:categoryId')
  .get(getCategory)
  .patch(
    validateRequestBody(upsertCategoryValidationSchema),
    authenticate,
    authorize(admin),
    updateCategory,
  )
  .delete(authenticate, authorize(admin), deleteCategory);

module.exports = router;
