const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
     const messages = err.errors.map(e => e.message);
     return error(res, messages.join(', '), 400, err);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return error(res, 'Duplicate entry', 409, err);
  }

  return error(res, 'Internal Server Error', 500, err);
};

module.exports = errorHandler;
