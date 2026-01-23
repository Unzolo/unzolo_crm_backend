const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

// Protect all routes
router.use(authenticate);
router.use(adminOnly);

router.get('/stats', adminController.getGlobalStats);
router.get('/partners', adminController.getAllPartners);
router.get('/partners/:id', adminController.getPartnerDetails);
router.patch('/partners/:id/status', adminController.updatePartnerStatus);
router.get('/trips/:id/bookings', adminController.getTripBookings);
router.get('/trips', adminController.getAllTrips);
router.get('/bookings/:id', adminController.getBookingDetails);

// System Settings
router.get('/settings/maintenance', adminController.getMaintenanceMode);
router.post('/settings/maintenance', adminController.toggleMaintenanceMode);

module.exports = router;
