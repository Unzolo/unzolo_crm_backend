const tripService = require('../services/trip.service');
const { success, error } = require('../utils/response');

const createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body, req.user.id);
    return success(res, trip, 'Trip created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getTrips = async (req, res) => {
  try {
    const trips = await tripService.getTrips(req.user.id);
    return success(res, trips);
  } catch (err) {
    return error(res, err.message);
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.id);
    if (!trip) return error(res, 'Trip not found', 404);
    return success(res, trip);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateTrip = async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
    return success(res, trip, 'Trip updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteTrip = async (req, res) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user.id);
    return success(res, null, 'Trip deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
