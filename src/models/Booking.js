const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { BOOKING_STATUS } = require('../utils/constants');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(BOOKING_STATUS)),
    defaultValue: BOOKING_STATUS.PENDING,
  },
  bookingDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'bookings',
  timestamps: true,
});

module.exports = Booking;
