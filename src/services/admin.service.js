const { Partner, Trip, Booking, Payment, Customer, Enquiry } = require('../models');

const getAllPartners = async () => {
    return await Partner.findAll({
        attributes: { exclude: ['password', 'otp', 'otpExpires', 'resetPasswordToken', 'resetPasswordExpire'] },
        include: [{ model: Trip, attributes: ['id'] }],
        order: [['createdAt', 'DESC']]
    });
};

const getPartnerDetails = async (partnerId) => {
    const partner = await Partner.findByPk(partnerId, {
        attributes: { exclude: ['password', 'otp', 'otpExpires', 'resetPasswordToken', 'resetPasswordExpire'] },
        include: [
            {
                model: Trip,
                include: [
                    {
                        model: Booking,
                        include: [{ model: Payment }, { model: Customer }]
                    }
                ]
            },
            {
                model: Enquiry
            }
        ]
    });
    return partner;
};

const updatePartnerStatus = async (partnerId, status) => {
    const partner = await Partner.findByPk(partnerId);
    if (!partner) throw new Error('Partner not found');
    
    await partner.update({ status });
    return partner;
};

const getGlobalStats = async () => {
    const [partners, trips, bookings, totalEarnings] = await Promise.all([
        Partner.count(),
        Trip.count(),
        Booking.count(),
        Payment.sum('amount', { where: { status: 'completed' } })
    ]);

    return {
        totalPartners: partners,
        totalTrips: trips,
        totalBookings: bookings,
        totalEarnings: totalEarnings || 0
    };
};

module.exports = {
    getAllPartners,
    getPartnerDetails,
    updatePartnerStatus,
    getGlobalStats
};
