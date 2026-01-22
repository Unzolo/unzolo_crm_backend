const { Trip, Expense, sequelize } = require('../models');

const createTrip = async (data, partnerId) => {
  // data contains title, description, price, destination, advanceAmount, type, startDate, endDate, capacity
  return await Trip.create({ ...data, partnerId });
};

const getTrips = async (partnerId) => {
  const trips = await Trip.findAll({ where: { partnerId } });
  
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

  const expenseMap = (expenses || []).reduce((acc, curr) => {
    acc[curr.tripId] = curr.get('total') || 0;
    return acc;
  }, {});

  return trips.map(trip => ({
    ...trip.toJSON(),
    totalExpenses: parseFloat(expenseMap[trip.id] || 0)
  }));
};

const getTripById = async (id, partnerId) => {
  const trip = await Trip.findOne({ where: { id, partnerId } });
  if (!trip) return null;

  const totalExpenses = await Expense.sum('amount', { where: { tripId: id } }) || 0;
  
  return {
    ...trip.toJSON(),
    totalExpenses: parseFloat(totalExpenses)
  };
};

const updateTrip = async (id, partnerId, data) => {
  const trip = await Trip.findOne({ where: { id, partnerId } });
  if (!trip) throw new Error('Trip not found');
  
  return await trip.update(data);
};

const deleteTrip = async (id, partnerId) => {
  const trip = await Trip.findOne({ where: { id, partnerId } });
  if (!trip) throw new Error('Trip not found');
  
  await trip.destroy();
  return true;
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
