const express = require('express');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  rateProduct,
  getSimilarProducts,
  getProductBrands,
} = require('./product.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { userRoles } = require('../user/user.constants');
const validateRequestBody = require('../../middlewares/validate-request-body');
const {
  productCreateValidationSchema,
  productUpdateValidationSchema,
  productRateValidationSchema,
} = require('./product.validationSchema');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getProducts)
  .post(
    validateRequestBody(productCreateValidationSchema),
    authenticate,
    authorize(userRoles.admin),
    createProduct,
  );

router.route('/brands').get(getProductBrands);

router
  .route('/:productId')
  .get(getProduct)
  .patch(
    validateRequestBody(productUpdateValidationSchema),
    authenticate,
    authorize(userRoles.admin),
    updateProduct,
  )
  .delete(authenticate, authorize(userRoles.admin), deleteProduct);

router
  .route('/:productId/rate')
  .patch(
    validateRequestBody(productRateValidationSchema),
    authenticate,
    rateProduct,
  );

router.route('/:productId/similar').get(getSimilarProducts);

module.exports = router;
