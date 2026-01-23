const express = require('express');
const router = express.Router();
const { SystemSetting } = require('../models');
const { success } = require('../utils/response');

router.get('/maintenance', async (req, res) => {
    const setting = await SystemSetting.findOne({ where: { key: 'maintenance_mode' } });
    const isMaintenance = setting ? setting.value === 'true' : false;
    return success(res, { maintenanceMode: isMaintenance });
});

module.exports = router;
