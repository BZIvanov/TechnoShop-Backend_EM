const Joi = require('joi');

const createCouponValidationSchema = Joi.object({
  name: Joi.string().trim(true).min(2).max(20).required(),
  discount: Joi.number().positive().min(0.01).max(99.99).required(),
  expirationDate: Joi.date().required(),
});

module.exports = {
  createCouponValidationSchema,
};
