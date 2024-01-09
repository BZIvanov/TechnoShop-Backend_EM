const Joi = require('joi');

const productCreateValidationSchema = Joi.object({
  title: Joi.string().trim(true).min(2).max(32).required(),
  description: Joi.string().max(2000).required(),
  price: Joi.number().positive().min(0.01).max(99999).required(),
  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')
    .required(),
  subcategories: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')
        .required(),
    )
    .required(),
  quantity: Joi.number().positive().required(),
  images: Joi.array().items(
    Joi.object({
      publicId: Joi.string(),
      imageUrl: Joi.string(),
    }),
  ),
  shipping: Joi.string().valid('Yes', 'No').required(),
  color: Joi.string().trim(true).max(32).required(),
  brand: Joi.string().trim(true).max(32).required(),
});

const productUpdateValidationSchema = Joi.object({
  title: Joi.string().trim(true).min(2).max(32),
  description: Joi.string().max(2000),
  price: Joi.number().positive().min(0.01).max(99999),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
  subcategories: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
  ),
  quantity: Joi.number().positive(),
  images: Joi.array().items(
    Joi.object({
      _id: Joi.string(), // it will be added by mongodb and available, when editing images
      publicId: Joi.string(),
      imageUrl: Joi.string(),
    }),
  ),
  shipping: Joi.string().valid('Yes', 'No'),
  color: Joi.string().trim(true).max(32),
  brand: Joi.string().trim(true).max(32),
});

const productRateValidationSchema = Joi.object({
  rating: Joi.number().integer().positive().min(1).max(5),
});

module.exports = {
  productCreateValidationSchema,
  productUpdateValidationSchema,
  productRateValidationSchema,
};
