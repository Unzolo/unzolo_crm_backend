const { SystemSetting } = require('../models');
const { error } = require('../utils/response');

const checkMaintenanceMode = async (req, res, next) => {
    try {
        // Skip maintenance check for Admins and Admin routes
        const isAdminRoute = req.path.startsWith('/admin') || req.originalUrl.includes('/admin');
        const userEmail = req.user?.email || "";
        
        if (isAdminRoute || userEmail === "unzoloapp@gmail.com") {
            return next();
        }

        const setting = await SystemSetting.findOne({ where: { key: 'maintenance_mode' } });
        const isMaintenance = setting ? setting.value === 'true' : false;

        if (isMaintenance) {
            return error(res, 'System is under maintenance. Please try again later.', 503);
        }

        next();
    } catch (err) {
        next(); // Proceed if check fails to avoid blocking the app
    }
};

module.exports = checkMaintenanceMode;
