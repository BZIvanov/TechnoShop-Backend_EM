const express = require('express');

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('./category.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const fileUpload = require('../../middlewares/file-upload');
const { userRoles } = require('../user/user.constants');
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
    authenticate,
    authorize(userRoles.admin),
    fileUpload.single('categoryImage'),
    createCategory,
  );
router
  .route('/:categoryId')
  .get(getCategory)
  .patch(
    authenticate,
    authorize(userRoles.admin),
    fileUpload.single('categoryImage'),
    updateCategory,
  )
  .delete(authenticate, authorize(userRoles.admin), deleteCategory);

module.exports = router;
