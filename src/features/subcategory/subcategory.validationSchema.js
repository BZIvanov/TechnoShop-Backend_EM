const Joi = require('joi');

const upsertSubcategoryValidationSchema = Joi.object({
  name: Joi.string().trim(true).min(2).max(32).required(),
  categoryId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')
    .required(),
});

module.exports = {
  upsertSubcategoryValidationSchema,
};
