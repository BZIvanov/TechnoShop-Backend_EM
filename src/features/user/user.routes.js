const express = require('express');

const { register, login } = require('./user.controllers');
const validateRequestBody = require('../../middlewares/validate-request-body');
const {
  registerValidationSchema,
  loginValidationSchema,
} = require('./user.validationSchema');

const router = express.Router();

router
  .route('/register')
  .post(validateRequestBody(registerValidationSchema), register);
router.route('/login').post(validateRequestBody(loginValidationSchema), login);

module.exports = router;
