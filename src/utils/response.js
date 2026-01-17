/**
 * Send success response
 * @param {Response} res 
 * @param {any} data 
 * @param {string} message 
 * @param {number} statusCode 
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {Response} res 
 * @param {string} message 
 * @param {number} statusCode 
 * @param {any} error 
 */
const error = (res, message = 'Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  error,
};
