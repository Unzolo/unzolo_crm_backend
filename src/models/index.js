const sequelize = require('../config/db');
const Partner = require('./Partner');
const Trip = require('./Trip');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Customer = require('./Customer');

// Partner <-> Trip
Partner.hasMany(Trip, { foreignKey: 'partnerId' });
Trip.belongsTo(Partner, { foreignKey: 'partnerId' });

// Trip <-> Booking
Trip.hasMany(Booking, { foreignKey: 'tripId' });
Booking.belongsTo(Trip, { foreignKey: 'tripId' });

// Partner <-> Booking (For easier earnings calculation per partner)
Partner.hasMany(Booking, { foreignKey: 'partnerId' });
Booking.belongsTo(Partner, { foreignKey: 'partnerId' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });

// Booking <-> Customer
Booking.hasMany(Customer, { foreignKey: 'bookingId' });
Customer.belongsTo(Booking, { foreignKey: 'bookingId' });

module.exports = {
  sequelize,
  Partner,
  Trip,
  Booking,
  Payment,
  Customer,
};
