const { Trip, Expense, Partner, Booking, sequelize } = require('../models');

const createTrip = async (data, partnerId) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner || !partner.hasActiveSubscription()) {
    throw new Error('Subscription required to create trips. Please upgrade your plan.');
  }
  // data contains title, description, price, destination, advanceAmount, type, startDate, endDate, capacity
  return await Trip.create({ ...data, partnerId });
};

const getTrips = async (partnerId) => {
  const trips = await Trip.findAll({ 
    where: { 
      partnerId,
      status: 'active'
    } 
  });
  
  const tripIds = (trips || []).map(t => t.id);
  if (tripIds.length === 0) return [];

  const expenses = await Expense.findAll({
    where: { tripId: tripIds },
    attributes: [
      'tripId',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    group: ['tripId']
  });

  const bookingsCount = await Booking.findAll({
    where: { 
      tripId: tripIds,
      status: { [require('sequelize').Op.ne]: 'cancelled' }
    },
    attributes: [
      'tripId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total']
    ],
    group: ['tripId']
  });

  const expenseMap = (expenses || []).reduce((acc, curr) => {
    acc[curr.tripId] = curr.get('total') || 0;
    return acc;
  }, {});

  const bookingMap = (bookingsCount || []).reduce((acc, curr) => {
    acc[curr.tripId] = parseInt(curr.get('total')) || 0;
    return acc;
  }, {});

  return trips.map(trip => ({
    ...trip.toJSON(),
    totalExpenses: parseFloat(expenseMap[trip.id] || 0),
    bookingCount: bookingMap[trip.id] || 0
  }));
};

const getInactiveTrips = async (partnerId) => {
  const trips = await Trip.findAll({ 
    where: { 
      partnerId,
      status: 'inactive'
    },
    order: [['updatedAt', 'DESC']]
  });
  
  return trips.map(trip => trip.toJSON());
};

const getTripById = async (id, partnerId) => {
  const trip = await Trip.findOne({ 
    where: { 
      id, 
      partnerId,
      status: 'active'
    } 
  });
  if (!trip) return null;

  const totalExpenses = await Expense.sum('amount', { where: { tripId: id } }) || 0;
  const bookingCount = await Booking.count({ 
    where: { 
      tripId: id,
      status: { [require('sequelize').Op.ne]: 'cancelled' }
    } 
  });
  
  return {
    ...trip.toJSON(),
    totalExpenses: parseFloat(totalExpenses),
    bookingCount: bookingCount
  };
};

const updateTrip = async (id, partnerId, data) => {
  const trip = await Trip.findOne({ 
    where: { 
      id, 
      partnerId,
      status: 'active'
    } 
  });
  if (!trip) throw new Error('Trip not found');
  
  return await trip.update(data);
};

const deleteTrip = async (id, partnerId) => {
  const trip = await Trip.findOne({ where: { id, partnerId } });
  if (!trip) throw new Error('Trip not found');
  
  await trip.update({ status: 'inactive' });
  return true;
};

const recoverTrip = async (id, partnerId) => {
  const trip = await Trip.findOne({ where: { id, partnerId, status: 'inactive' } });
  if (!trip) throw new Error('Inactive trip not found');
  
  await trip.update({ status: 'active' });
  return trip;
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getInactiveTrips,
  recoverTrip,
};
