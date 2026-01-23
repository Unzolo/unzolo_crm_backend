const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { ENQUIRY_STATUS } = require('../utils/constants');

const Enquiry = sequelize.define('Enquiry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ENQUIRY_STATUS)),
    defaultValue: ENQUIRY_STATUS.WARM,
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  partnerId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  tableName: 'enquiries',
  timestamps: true,
});

module.exports = Enquiry;
