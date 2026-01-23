const sequelize = require('../config/db');
const Partner = require('./Partner');
const Trip = require('./Trip');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Customer = require('./Customer');
const Expense = require('./Expense');
const Enquiry = require('./Enquiry');

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

// Trip <-> Expense
Trip.hasMany(Expense, { foreignKey: 'tripId' });
Expense.belongsTo(Trip, { foreignKey: 'tripId' });

// Partner <-> Enquiry
Partner.hasMany(Enquiry, { foreignKey: 'partnerId' });
Enquiry.belongsTo(Partner, { foreignKey: 'partnerId' });

module.exports = {
  sequelize,
  Partner,
  Trip,
  Booking,
  Payment,
  Customer,
  Expense,
  Enquiry,
};
