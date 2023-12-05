const express = require('express');

const {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('./subcategory.controllers');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const {
  userTypes: { admin },
} = require('../user/user.constants');
const validateRequestBody = require('../../middlewares/validate-request-body');
const {
  upsertSubcategoryValidationSchema,
} = require('./subcategory.validationSchema');

// set mergeParams to true to receive the params from the category router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getSubcategories)
  .post(
    validateRequestBody(upsertSubcategoryValidationSchema),
    authenticate,
    authorize(admin),
    createSubcategory,
  );
router
  .route('/:id')
  .get(getSubcategory)
  .put(
    validateRequestBody(upsertSubcategoryValidationSchema),
    authenticate,
    authorize(admin),
    updateSubcategory,
  )
  .delete(authenticate, authorize(admin), deleteSubcategory);

module.exports = router;
