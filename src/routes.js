const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const bookingRoutes = require('./routes/booking.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const paymentRoutes = require('./routes/payment.routes');
const expenseRoutes = require('./routes/expense.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const adminRoutes = require('./routes/admin.routes');
const systemRoutes = require('./routes/system.routes');
const checkMaintenance = require('./middlewares/maintenance.middleware');

router.get('/system/maintenance', (req, res, next) => {
    // Direct bypass for this specific route
    next();
}, systemRoutes);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Apply maintenance check to all other routes
router.use(checkMaintenance);

router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/enquiries', enquiryRoutes);

module.exports = router;
