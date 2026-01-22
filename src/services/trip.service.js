const { Trip, sequelize } = require('../models');

const createTrip = async (data, partnerId) => {
  // data contains title, description, price, destination, advanceAmount, type, startDate, endDate, capacity
  return await Trip.create({ ...data, partnerId });
};

const getTrips = async (partnerId) => {
  return await Trip.findAll({
    where: { partnerId },
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses AS Expense
            WHERE Expense.tripId = Trip.id
          )`),
          'totalExpenses'
        ]
      ]
    }
  });
};

const getTripById = async (id, partnerId) => {
  return await Trip.findOne({
    where: { id, partnerId },
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses AS Expense
            WHERE Expense.tripId = Trip.id
          )`),
          'totalExpenses'
        ]
      ]
    }
  });
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
