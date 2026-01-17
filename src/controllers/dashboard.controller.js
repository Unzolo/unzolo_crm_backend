const dashboardService = require('../services/dashboard.service');
const { success, error } = require('../utils/response');

const getStats = async (req, res) => {
  try {
    const stats = await dashboardService.getStats(req.user.id);
    return success(res, stats);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getStats,
};
