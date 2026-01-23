const { Enquiry } = require('../models');

const createEnquiry = async (data, partnerId) => {
  try {
    const enquiry = await Enquiry.create({
      ...data,
      partnerId,
    });
    return enquiry;
  } catch (error) {
    throw error;
  }
};

const getEnquiries = async (partnerId) => {
  try {
    const enquiries = await Enquiry.findAll({
      where: { partnerId },
      order: [['createdAt', 'DESC']],
    });
    return enquiries;
  } catch (error) {
    throw error;
  }
};

const getEnquiryById = async (id, partnerId) => {
  try {
    const enquiry = await Enquiry.findOne({
      where: { id, partnerId },
    });
    return enquiry;
  } catch (error) {
    throw error;
  }
};

const updateEnquiry = async (id, data, partnerId) => {
  try {
    const enquiry = await Enquiry.findOne({
      where: { id, partnerId },
    });
    if (!enquiry) {
      throw new Error('Enquiry not found');
    }
    await enquiry.update(data);
    return enquiry;
  } catch (error) {
    throw error;
  }
};

const deleteEnquiry = async (id, partnerId) => {
  try {
    const enquiry = await Enquiry.findOne({
      where: { id, partnerId },
    });
    if (!enquiry) {
      throw new Error('Enquiry not found');
    }
    await enquiry.destroy();
    return { message: 'Enquiry deleted successfully' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};
