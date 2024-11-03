const Joi = require('joi');

const { userRoles } = require('./user.constants');

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})/;

const usernameSchema = Joi.string().min(2).max(30).required();

const emailSchema = Joi.string().max(100).required().email();

const passwordSchema = Joi.string().regex(passwordRegex).required().messages({
  // rewrite the default message, so the password will not be included in the message
  'string.pattern.base':
    'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
});

const roleSchema = Joi.string()
  .valid(userRoles.buyer, userRoles.seller)
  .messages({
    'any.only': 'Role must be either "buyer" or "seller"',
  });

const addressSchema = Joi.string().max(200);

const tokenSchema = Joi.string().min(5).max(50).required();

const registerValidationSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: roleSchema,
});

const loginValidationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

const forgotPasswordValidationSchema = Joi.object({
  email: emailSchema,
});

const resetPasswordValidationSchema = Joi.object({
  newPassword: passwordSchema,
  token: tokenSchema,
});

const updatePasswordValidationSchema = Joi.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});

module.exports = {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  updatePasswordValidationSchema,
};
