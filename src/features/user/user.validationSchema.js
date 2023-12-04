const Joi = require('joi');

const passwrodRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})/;

const registerValidationSchema = Joi.object({
  username: Joi.string().min(2).max(30).required(),
  email: Joi.string().max(100).required().email(),
  password: Joi.string().regex(passwrodRegex).required().messages({
    // rewrite the default message, so the password will not be included in the message
    'string.pattern.base':
      'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
  }),
  address: Joi.string().max(200),
});

const loginValidationSchema = Joi.object({
  email: Joi.string().max(100).required().email(),
  password: Joi.string().min(5).max(50).required(),
});

const forgotPasswordValidationSchema = Joi.object({
  email: Joi.string().max(100).required().email(),
});

const updatePasswordValidationSchema = Joi.object({
  oldPassword: Joi.string().min(8).max(30).required(),
  newPassword: Joi.string().regex(passwrodRegex).required().messages({
    'string.pattern.base':
      'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
  }),
});

module.exports = {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  updatePasswordValidationSchema,
};
