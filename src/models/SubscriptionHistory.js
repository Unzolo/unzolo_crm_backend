const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubscriptionHistory = sequelize.define('SubscriptionHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  partnerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pro',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = SubscriptionHistory;
