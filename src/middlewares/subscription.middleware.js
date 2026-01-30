const { Partner } = require('../models');

const checkSubscription = async (req, res, next) => {
    try {
        const partnerId = req.user.id; // Populated by auth middleware
        const partner = await Partner.findByPk(partnerId);

        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        // TEMP: Only apply gating to the test account for now
        if (partner.email !== 'muhammedrafeeqvr805@gmail.com') {
            return next();
        }

        if (!partner.hasActiveSubscription()) {
            return res.status(403).json({ 
                message: 'Subscription required to access this feature. Please upgrade your plan.',
                subscriptionStatus: 'expired'
            });
        }

        next();
    } catch (err) {
        console.error('Subscription Middleware Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = checkSubscription;
