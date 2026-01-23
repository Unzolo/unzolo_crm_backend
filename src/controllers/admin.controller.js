const adminService = require('../services/admin.service');
const { success, error } = require('../utils/response');

const getAllPartners = async (req, res) => {
    try {
        const partners = await adminService.getAllPartners();
        return success(res, partners);
    } catch (err) {
        return error(res, err.message);
    }
};

const getPartnerDetails = async (req, res) => {
    try {
        const partner = await adminService.getPartnerDetails(req.params.id);
        if (!partner) return error(res, 'Partner not found', 404);
        return success(res, partner);
    } catch (err) {
        return error(res, err.message);
    }
};

const updatePartnerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const partner = await adminService.updatePartnerStatus(req.params.id, status);
        return success(res, partner, 'Partner status updated successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

const getGlobalStats = async (req, res) => {
    try {
        const stats = await adminService.getGlobalStats();
        return success(res, stats);
    } catch (err) {
        return error(res, err.message);
    }
};

module.exports = {
    getAllPartners,
    getPartnerDetails,
    updatePartnerStatus,
    getGlobalStats
};
