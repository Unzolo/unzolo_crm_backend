const enquiryService = require('../services/enquiry.service');
const { success, error } = require('../utils/response');

const createEnquiry = async (req, res) => {
  try {
    const enquiry = await enquiryService.createEnquiry(req.body, req.user.id);
    return success(res, enquiry, 'Enquiry created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getEnquiries = async (req, res) => {
  try {
    const enquiries = await enquiryService.getEnquiries(req.user.id);
    return success(res, enquiries);
  } catch (err) {
    return error(res, err.message);
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id, req.user.id);
    if (!enquiry) return error(res, 'Enquiry not found', 404);
    return success(res, enquiry);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await enquiryService.updateEnquiry(req.params.id, req.body, req.user.id);
    return success(res, enquiry, 'Enquiry updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const result = await enquiryService.deleteEnquiry(req.params.id, req.user.id);
    return success(res, result, 'Enquiry deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};
