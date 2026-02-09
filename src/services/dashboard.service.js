const { Booking, Trip } = require('../models');
const { Op } = require('sequelize');
const { BOOKING_STATUS } = require('../utils/constants');

const getStats = async (partnerId) => {
  const totalTrips = await Trip.count({ 
    where: { 
      partnerId,
      status: 'active'
    } 
  });
  
  const totalBookings = await Booking.count({ 
    where: { 
      partnerId,
      isActive: true,
      status: { [Op.ne]: BOOKING_STATUS.CANCELLED }
    },
    include: [{
      model: Trip,
      where: { status: 'active' },
      required: true,
      attributes: []
    }],
    distinct: true
  });
  
  const earnings = await Booking.sum('amount', { 
    where: { 
      partnerId,
      isActive: true,
      status: { [Op.ne]: BOOKING_STATUS.CANCELLED }
    },
    include: [{
      model: Trip,
      where: { status: 'active' },
      required: true,
      attributes: []
    }]
  }) || 0;
  
  // Basic monthly earnings (current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  const monthlyEarnings = await Booking.sum('amount', { 
    where: { 
      partnerId,
      isActive: true,
      status: { [Op.ne]: BOOKING_STATUS.CANCELLED },
      createdAt: {
        [Op.gte]: startOfMonth
      }
    },
    include: [{
      model: Trip,
      where: { status: 'active' },
      required: true,
      attributes: []
    }]
  }) || 0;

  return {
    totalTrips,
    totalBookings,
    totalEarnings: parseFloat(earnings),
    monthlyEarnings: parseFloat(monthlyEarnings)
  };
};

module.exports = {
  getStats,
};
