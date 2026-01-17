const { Booking, Trip, Customer, sequelize } = require('../models');


const createBooking = async (data, partnerId) => {
  const transaction = await sequelize.transaction();
  try {
    const { tripId, members, paymentType, customAmount, amount, paymentMethod, transactionId } = data;

    // Check if trip exists and belongs to partner
    const trip = await Trip.findOne({ 
      where: { id: tripId, partnerId },
      transaction 
    });
    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    // Calculate Amount
    let totalAmount = 0;
    const memberCount = members.length;

    if (paymentType === 'full') {
      totalAmount = parseFloat(trip.price) * memberCount;
    } else if (paymentType === 'advance') {
      totalAmount = parseFloat(trip.advanceAmount) * memberCount;
    } else if (paymentType === 'custom') {
      // Use amount or customAmount
      totalAmount = parseFloat(amount || customAmount);
    }

    // Create Booking
    const booking = await Booking.create({
      tripId,
      partnerId,
      amount: totalAmount,
      status: 'pending',
    }, { transaction });

    // Create Customers
    const customersData = members.map(member => ({
      ...member,
      bookingId: booking.id,
    }));
    await Customer.bulkCreate(customersData, { transaction });

    // Create Initial Payment
    const { Payment } = require('../models'); // Late require to avoid circular dependency issues if any
    await Payment.create({
      bookingId: booking.id,
      amount: totalAmount,
      method: paymentMethod,
      transactionId: transactionId || null,
      status: 'completed', // Assuming initial payment is successful if recording it here
      paymentDate: new Date(),
    }, { transaction });

    await transaction.commit();
    
    // Return booking with customers
    return await Booking.findByPk(booking.id, {
      include: [
        { model: Customer },
        { model: Trip }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getBookings = async (partnerId) => {
  return await Booking.findAll({
    where: { partnerId },
    include: [
      { 
        model: Trip,
        attributes: ['title', 'destination', 'startDate']
      },
      {
        model: Customer,
        where: { isPrimary: true },
        required: false, // In case legacy data doesn't have customers (though we just refactored)
      }
    ],
    order: [['createdAt', 'DESC']],
  });
};

const getBookingById = async (id, partnerId) => {
  const booking = await Booking.findOne({
    where: { id, partnerId },
    include: [
      { model: Trip },
      { model: Customer } // Include all members for details view
    ],
  });
  if (!booking) {
    throw new Error('Booking not found');
  }
  return booking;
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
};
