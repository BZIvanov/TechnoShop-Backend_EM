const status = require('http-status');
const AppError = require('../utils/app-error');

module.exports = (joiSchema) => (req, res, next) => {
  const { value, error } = joiSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, status.BAD_REQUEST));
  }

  // replace the body object with the joi value, which is needed in case we used trim() or similar function
  req.body = value;

  next();
};
