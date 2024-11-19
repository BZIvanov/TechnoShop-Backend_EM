const express = require('express');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getProductBrands,
} = require('./product.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const fileUpload = require('../../middlewares/file-upload');
const { userRoles } = require('../user/user.constants');
const validateRequestBody = require('../../middlewares/validate-request-body');
const {
  productCreateValidationSchema,
  productUpdateValidationSchema,
} = require('./product.validationSchema');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getProducts)
  .post(
    authenticate,
    authorize(userRoles.seller),
    fileUpload.array('newImages', 10),
    validateRequestBody(productCreateValidationSchema),
    createProduct,
  );

router.route('/brands').get(getProductBrands);

router
  .route('/:productId')
  .get(getProduct)
  .patch(
    authenticate,
    authorize(userRoles.seller),
    fileUpload.array('newImages', 10),
    validateRequestBody(productUpdateValidationSchema),
    updateProduct,
  )
  .delete(authenticate, authorize(userRoles.seller), deleteProduct);

router.route('/:productId/similar').get(getSimilarProducts);

module.exports = router;
