const express = require('express');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  rateProduct,
  getSimilarProducts,
} = require('./product.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const {
  userTypes: { admin },
} = require('../user/user.constants');
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
    authorize(admin),
    createProduct,
  );

router
  .route('/:productId')
  .get(getProduct)
  .patch(
    validateRequestBody(productUpdateValidationSchema),
    authenticate,
    authorize(admin),
    updateProduct,
  )
  .delete(authenticate, authorize(admin), deleteProduct);

router
  .route('/:productId/rate')
  .patch(
    validateRequestBody(productRateValidationSchema),
    authenticate,
    rateProduct,
  );

router.route('/:productId/similar').get(getSimilarProducts);

module.exports = router;
