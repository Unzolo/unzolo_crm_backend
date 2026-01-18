const { Booking, Trip, Customer, Payment, sequelize } = require('../models');


const createBooking = async (data, partnerId) => {
  const transaction = await sequelize.transaction();
  try {
    const { tripId, members, paymentType, customAmount, amount, paymentMethod, paymentDate, transactionId, screenshotUrl } = data;

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
      paymentType: paymentType, // Pass paymentType (full/advance)
      transactionId: transactionId || null,
      screenshotUrl: screenshotUrl || null,
      status: 'completed', // Assuming initial payment is successful if recording it here
      paymentDate: paymentDate, // Use provided date
    }, { transaction });

    await transaction.commit();
    
    // Return booking with customers
    return await Booking.findByPk(booking.id, {
      include: [
        { model: Customer },
        { model: Trip },
        { model: Payment }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getBookings = async (partnerId, tripId = null) => {
  const whereClause = { partnerId };
  if (tripId) {
    whereClause.tripId = tripId;
  }

  const bookings = await Booking.findAll({
    where: whereClause,
    include: [
      { 
        model: Trip,
        attributes: ['id', 'title', 'destination', 'startDate', 'price', 'advanceAmount']
      },
      {
        model: Customer,
        required: false,
      }
    ],
    order: [['createdAt', 'DESC']],
  });

  const formattedBookings = bookings.map(booking => {
    const bookingJson = booking.toJSON();
    const memberCount = bookingJson.Customers ? bookingJson.Customers.length : 0;
    const tripPrice = parseFloat(bookingJson.Trip.price);
    const advanceAmount = parseFloat(bookingJson.Trip.advanceAmount);
    const totalCost = tripPrice * memberCount;
    const paidAmount = parseFloat(bookingJson.amount);
    
    return {
      ...bookingJson,
      totalCost,
      paidAmount,
      memberCount,
      tripAdvanceAmount: advanceAmount,
    };
  });

  if (tripId) {
    let totalCustomers = 0;
    let fullyPaidCustomers = 0;
    let advancePaidCustomers = 0;
    let totalCollected = 0;
    let totalPending = 0;

    formattedBookings.forEach(b => {
      totalCustomers += b.memberCount;
      totalCollected += b.paidAmount;
      
      const pending = b.totalCost - b.paidAmount;
      totalPending += Math.max(0, pending); // Ensure no negative pending

      // Payment Status Counts (Member-wise)
      if (b.paidAmount >= b.totalCost - 0.01) { // Tolerance for float precision
        fullyPaidCustomers += b.memberCount;
      } else {
         // Check if they paid at least the advance amount per person
         const requiredAdvance = b.tripAdvanceAmount * b.memberCount;
         if (b.paidAmount >= requiredAdvance - 0.01) {
             advancePaidCustomers += b.memberCount;
         }
         // Else: Paid less than advance (not requested to track specifically)
      }
    });

    return {
      summary: {
        totalCustomers,
        fullyPaidCustomers,
        advancePaidCustomers,
        totalCollected,
        totalPending
      },
      bookings: formattedBookings
    };
  }

  return formattedBookings;
};

const getBookingById = async (id, partnerId) => {
  const booking = await Booking.findOne({
    where: { id, partnerId },
    include: [
      { model: Trip },
      { model: Customer }, // Include all members for details view
      { 
        model: Payment,
        separate: true, // Use separate query for sorting
        order: [['paymentDate', 'DESC']]
      }
    ],
  });
  if (!booking) {
    throw new Error('Booking not found');
  }

  const bookingJson = booking.toJSON();
  const memberCount = bookingJson.Customers ? bookingJson.Customers.length : 0;
  const tripPrice = parseFloat(bookingJson.Trip.price);
  const totalCost = tripPrice * memberCount;
  const paidAmount = parseFloat(bookingJson.amount);
  const remainingAmount = Math.max(0, totalCost - paidAmount);

  return {
    ...bookingJson,
    totalCost,
    paidAmount,
    remainingAmount,
  };
};

const addPaymentToBooking = async (bookingId, paymentData, partnerId) => {
  const transaction = await sequelize.transaction();
  try {
    const { amount: inputAmount, paymentType, paymentMethod, paymentDate, transactionId, screenshotUrl } = paymentData;

    // 1. Check if booking exists and belongs to partner, include Trip and Customer for calculation
    const booking = await Booking.findOne({
      where: { id: bookingId, partnerId },
      include: [
        { model: Trip },
        { model: Customer }
      ],
      transaction,
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    // 2. Calculate Payment Amount
    let paymentAmount = 0;

    if (paymentType === 'balance') {
      const tripPrice = parseFloat(booking.Trip.price);
      const memberCount = booking.Customers.length;
      const totalTripCost = tripPrice * memberCount;
      const currentPaid = parseFloat(booking.amount);
      
      paymentAmount = totalTripCost - currentPaid;
      
      if (paymentAmount <= 0) {
         throw new Error('Booking is already fully paid or overpaid');
      }
    } else if (paymentType === 'custom') {
      paymentAmount = parseFloat(inputAmount);
    }

    // 3. Create Payment Record
    const payment = await Payment.create({
      bookingId: booking.id,
      amount: paymentAmount,
      method: paymentMethod,
      paymentType: paymentType, // Pass paymentType (balance/custom)
      transactionId: transactionId || null,
      screenshotUrl: screenshotUrl || null,
      status: 'completed',
      paymentDate: paymentDate, // Use provided date
    }, { transaction });

    // 4. Update Booking Amount (Total Paid)
    const newTotalAmount = parseFloat(booking.amount) + paymentAmount;
    
    await booking.update({
      amount: newTotalAmount
    }, { transaction });

    await transaction.commit();

    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  addPaymentToBooking,
};
