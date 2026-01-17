const { Booking, Trip } = require('../models');
const { Op } = require('sequelize');

const getStats = async (partnerId) => {
  const totalTrips = await Trip.count({ where: { partnerId } });
  const totalBookings = await Booking.count({ where: { partnerId } });
  
  const earnings = await Booking.sum('amount', { where: { partnerId } }) || 0;
  
  // Basic monthly earnings (current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  const monthlyEarnings = await Booking.sum('amount', { 
    where: { 
      partnerId,
      createdAt: {
        [Op.gte]: startOfMonth
      }
    } 
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
