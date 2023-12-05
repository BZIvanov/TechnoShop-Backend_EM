const Joi = require('joi');

const upsertCategoryValidationSchema = Joi.object({
  name: Joi.string().trim(true).min(2).max(32).required(),
});

module.exports = {
  upsertCategoryValidationSchema,
};
