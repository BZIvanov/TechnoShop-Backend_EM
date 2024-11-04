const Joi = require('joi');

const createCategoryValidationSchema = Joi.object({
  categoryName: Joi.string().trim(true).min(2).max(32).required(),
  categoryImage: Joi.any().required(),
});

const updateCategoryValidationSchema = Joi.object({
  categoryName: Joi.string().trim(true).min(2).max(32).optional(),
  categoryImage: Joi.any().optional(),
});

module.exports = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};
