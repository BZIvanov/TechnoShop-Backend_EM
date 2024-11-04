const httpStatus = require('http-status');
const AppError = require('../utils/app-error');

module.exports =
  (schema, fileField = 'file', validateOptions = { abortEarly: true }) =>
  (req, res, next) => {
    const dataToValidate = req.file
      ? { ...req.body, [fileField]: req.file }
      : req.body;

    const { value, error } = schema.validate(dataToValidate, validateOptions);

    if (error) {
      return next(
        new AppError(error.details[0].message, httpStatus.BAD_REQUEST),
      );
    }

    // replace the body object with the joi value, which is needed in case we used trim() or similar function
    req.body = value;

    next();
  };
