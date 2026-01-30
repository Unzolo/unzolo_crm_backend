const customerService = require('../services/customer.service');
const { success, error } = require('../utils/response');

const getCustomers = async (req, res) => {
  try {
    const customers = await customerService.getCustomers(req.user.id);
    return success(res, customers);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getCustomers
};
