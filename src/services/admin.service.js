const { sequelize, Partner, Trip, Booking, Payment, Customer, Enquiry, SystemSetting, SubscriptionHistory } = require('../models');

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
                        where: { isActive: true },
                        required: false,
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
    try {
        const [partnersCount, tripsCount, bookingsCount, totalEarnings, recentBookings, maintenanceMode] = await Promise.all([
            Partner.count(),
            Trip.count(),
            Booking.count({ where: { isActive: true } }),
            Payment.sum(sequelize.col('Payment.amount'), { 
                include: [{ model: Booking, where: { isActive: true }, attributes: [] }],
                where: { '$Payment.status$': 'completed' } 
            }),
            Booking.findAll({
                where: { isActive: true },
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: Partner, attributes: ['name'] },
                    { model: Trip, attributes: ['title'] }
                ]
            }),
            getMaintenanceMode()
        ]);

        const formattedRecentBookings = recentBookings.map(b => ({
            id: b.id,
            partnerName: b.Partner?.name || 'Partner',
            tripTitle: b.Trip?.title || 'Untitled Trip',
            totalAmount: b.amount,
            status: b.status,
            createdAt: b.createdAt
        }));

        return {
            totalPartners: partnersCount,
            totalTrips: tripsCount,
            totalBookings: bookingsCount,
            totalEarnings: parseFloat(totalEarnings || 0),
            recentBookings: formattedRecentBookings,
            maintenanceMode
        };
    } catch (err) {
        console.error('Error in getGlobalStats:', err);
        throw err;
    }
};

const getTripBookings = async (tripId, includeInactive = false) => {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    const whereClause = { tripId };
    if (!includeInactive) {
        whereClause.isActive = true;
    }

    const bookings = await Booking.findAll({
        where: whereClause,
        include: [
            { model: Customer },
            { model: Payment }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Calculate Summary (reuse logic or similar)
    const formattedBookings = bookings.map(booking => {
        const bookingJson = booking.toJSON();
        const tripPrice = parseFloat(trip.price);

        const cancelledMemberCount = bookingJson.Customers.filter(c => c.status === 'cancelled').length;
        const effectiveMemberCount = Math.max(0, bookingJson.memberCount - cancelledMemberCount);

        let totalCost = 0;
        if (bookingJson.totalPackagePrice) {
            totalCost = parseFloat(bookingJson.totalPackagePrice);
        } else {
            totalCost = tripPrice * effectiveMemberCount;
        }

        const paidAmount = parseFloat(bookingJson.amount);

        return {
            ...bookingJson,
            totalCost,
            paidAmount,
            activeMemberCount: effectiveMemberCount
        };
    });

    let totalCustomers = 0;
    let fullyPaidCustomers = 0;
    let advancePaidCustomers = 0;
    let totalCollected = 0;
    let totalPending = 0;

    formattedBookings.forEach(b => {
        totalCustomers += b.activeMemberCount;
        totalCollected += b.paidAmount;

        const pending = b.totalCost - b.paidAmount;
        if (pending > 0) totalPending += pending;

        if (pending <= 0) {
            fullyPaidCustomers += b.activeMemberCount;
        } else if (b.paidAmount > 0) {
            advancePaidCustomers += b.activeMemberCount;
        }
    });

    return {
        trip,
        summary: {
            totalCustomers,
            fullyPaidCustomers,
            advancePaidCustomers,
            totalCollected,
            totalPending
        },
        bookings: formattedBookings
    };
};

const getAllTrips = async () => {
    return await Trip.findAll({
        include: [
            {
                model: Partner,
                attributes: ['id', 'name', 'email']
            },
            {
                model: Booking,
                where: { isActive: true },
                required: false,
                attributes: ['id']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

const getBookingDetails = async (bookingId) => {
    const booking = await Booking.findByPk(bookingId, {
        include: [
            { model: Trip },
            { model: Customer },
            {
                model: Payment,
                separate: true,
                order: [['paymentDate', 'DESC']]
            }
        ],
    });

    if (!booking) throw new Error('Booking not found');

    const bookingJson = booking.toJSON();
    const tripPrice = parseFloat(bookingJson.Trip.price);

    const cancelledMemberCount = bookingJson.Customers.filter(c => c.status === 'cancelled').length;
    const effectiveMemberCount = Math.max(0, bookingJson.memberCount - cancelledMemberCount);
    
    let totalCost = 0;
    if (bookingJson.totalPackagePrice) {
        totalCost = parseFloat(bookingJson.totalPackagePrice);
    } else {
        totalCost = tripPrice * effectiveMemberCount;
    }

    let grossPaid = 0;
    let refundAmount = 0;

    if (bookingJson.Payments) {
        bookingJson.Payments.forEach(p => {
            const amt = parseFloat(p.amount);
            if (p.paymentType === 'refund') {
                refundAmount += amt;
            } else {
                grossPaid += amt;
            }
        });
    }

    const netPaid = grossPaid - refundAmount;
    const remainingAmount = totalCost - netPaid;

    return {
        ...bookingJson,
        totalCost,
        paidAmount: grossPaid,
        refundAmount,
        netPaidAmount: netPaid,
        remainingAmount,
        activeMemberCount: effectiveMemberCount,
        totalMemberCount: bookingJson.memberCount
    };
};

const updatePartnerSubscription = async (partnerId, data) => {
    const partner = await Partner.findByPk(partnerId);
    if (!partner) throw new Error('Partner not found');
    
    const { plan, subscriptionExpires, isWhatsappEnabled } = data;
    await partner.update({ plan, subscriptionExpires, isWhatsappEnabled });

    // Log this as a manual transaction in history
    await SubscriptionHistory.create({
        partnerId: partner.id,
        plan: plan || partner.plan,
        amount: 0,
        status: 'completed',
        orderId: `MANUAL_${Date.now()}`,
        metadata: { adminAction: true, note: 'Updated by administrator' },
        expiryDate: subscriptionExpires
    });

    return partner;
};

const toggleBookingStatus = async (bookingId, isActive) => {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('Booking not found');
    
    await booking.update({ isActive });
    return booking;
};

module.exports = {
    getAllPartners,
    getPartnerDetails,
    updatePartnerStatus,
    updatePartnerSubscription,
    getGlobalStats,
    getTripBookings,
    getAllTrips,
    getBookingDetails,
    toggleMaintenanceMode,
    getMaintenanceMode,
    toggleBookingStatus
};

async function toggleMaintenanceMode(isEnabled) {
    const [setting] = await SystemSetting.findOrCreate({
        where: { key: 'maintenance_mode' },
        defaults: { value: 'false', description: 'Enable/Disable maintenance mode for normal users' }
    });
    
    await setting.update({ value: isEnabled ? 'true' : 'false' });
    return setting.value === 'true';
}

async function getMaintenanceMode() {
    const setting = await SystemSetting.findOne({ where: { key: 'maintenance_mode' } });
    return setting ? setting.value === 'true' : false;
}
