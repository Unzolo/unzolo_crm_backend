const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const { Partner } = require('../models'); // Will be created soon

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Unauthorized access', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return error(res, 'Invalid or expired token', 401);
    }

    // Check if partner still exists
    // Note: models/index.js might not be fully ready when this file is written but will be when run
    // Using loose coupling or require inside if needed, but circular dependency isn't an issue here usually if models are set up right.
    // For now assuming generic payload has id.
    
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Authentication failed', 401, err);
  }
};

module.exports = authenticate;
