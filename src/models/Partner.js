const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active',
  },
}, {
  tableName: 'partners',
  timestamps: true,
  hooks: {
    beforeCreate: async (partner) => {
      if (partner.password) {
        partner.password = await bcrypt.hash(partner.password, 10);
      }
    },
    beforeUpdate: async (partner) => {
      if (partner.changed('password')) {
        partner.password = await bcrypt.hash(partner.password, 10);
      }
    },
  },
});

Partner.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

Partner.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.otp;
  delete values.otpExpires;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpire;
  return values;
};

module.exports = Partner;
