const { error } = require('../utils/response');

const adminOnly = (req, res, next) => {
  if (req.user && req.user.email === 'unzoloapp@gmail.com') {
    return next();
  }
  return error(res, 'Access denied. Admins only.', 403);
};

module.exports = adminOnly;
