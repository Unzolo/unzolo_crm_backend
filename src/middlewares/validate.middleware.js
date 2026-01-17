const { error } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const { error: validationError } = schema.validate(req.body, { abortEarly: false });

  if (validationError) {
    const errorMessage = validationError.details.map((details) => details.message).join(', ');
    return error(res, errorMessage, 400);
  }

  next();
};

module.exports = validate;
