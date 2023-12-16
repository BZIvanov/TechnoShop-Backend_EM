const express = require('express');

const {
  register,
  login,
  logout,
  currentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('./user.controllers');
const authenticate = require('../../middlewares/authenticate');
const validateRequestBody = require('../../middlewares/validate-request-body');
const {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  updatePasswordValidationSchema,
} = require('./user.validationSchema');

const router = express.Router();

router
  .route('/register')
  .post(validateRequestBody(registerValidationSchema), register);
router.route('/login').post(validateRequestBody(loginValidationSchema), login);
router.route('/logout').post(authenticate, logout);
router.route('/current-user').get(currentUser);
router
  .route('/update-password')
  .patch(
    validateRequestBody(updatePasswordValidationSchema),
    authenticate,
    updatePassword,
  );
router
  .route('/forgot-password')
  .post(validateRequestBody(forgotPasswordValidationSchema), forgotPassword);
router.route('/reset-password').post(resetPassword);

module.exports = router;
