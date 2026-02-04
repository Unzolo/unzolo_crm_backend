const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { BOOKING_STATUS } = require('../utils/constants'); // Re-using constants or defining new one if needed, but simple string is fine for now or add to constants

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    defaultValue: 'active',
  },
  place: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
