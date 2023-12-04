const express = require('express');

const { register, login, logout } = require('./user.controllers');
const authenticate = require('../../middlewares/authenticate');
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
router.route('/logout').post(authenticate, logout);

module.exports = router;
