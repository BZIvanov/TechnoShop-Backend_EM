const Joi = require('joi');

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})/;

const usernameSchema = Joi.string().min(2).max(30).required();

const emailSchema = Joi.string().max(100).required().email();

const passwordSchema = Joi.string().regex(passwordRegex).required().messages({
  // rewrite the default message, so the password will not be included in the message
  'string.pattern.base':
    'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
});

const addressSchema = Joi.string().max(200);

const tokenSchema = Joi.string().min(5).max(50).required();

const registerValidationSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
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
