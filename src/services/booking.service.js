const { Booking, Trip, Customer, Payment, sequelize } = require('../models');
const { BOOKING_STATUS } = require('../utils/constants'); // Import constants


const createBooking = async (data, partnerId) => {
  const transaction = await sequelize.transaction();
  try {
    const { tripId, members, paymentType, customAmount, amount, paymentMethod, paymentDate, transactionId, screenshotUrl, memberCount: inputMemberCount, preferredDate } = data;

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
    // For packages, use inputMemberCount if provided, otherwise members.length
    const memberCount = inputMemberCount ? parseInt(inputMemberCount) : members.length;

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
      memberCount: memberCount,
      preferredDate: preferredDate || null,
      status: (totalAmount >= parseFloat(trip.price) * memberCount) ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.PENDING,
    }, { transaction });

    // Create Customers
    const customersData = members.map(member => ({
      ...member,
      bookingId: booking.id,
    }));
    await Customer.bulkCreate(customersData, { transaction });

    // Create Initial Payment
    // const { Payment } = require('../models'); // Late require to avoid circular dependency issues if any // This line is no longer needed as Payment is already imported
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

    // Calculate additional fields
    const formattedBookings = bookings.map(booking => {
      const bookingJson = booking.toJSON();
      const tripPrice = parseFloat(bookingJson.Trip.price);
      
      // Count ACTIVE members for cost calculation
      // For packages, if they haven't listed all members, we use the booking.memberCount
      // If some listed members are cancelled, we should deduct them from the total count
      const cancelledMemberCount = bookingJson.Customers.filter(c => c.status === 'cancelled').length;
      const effectiveMemberCount = Math.max(0, bookingJson.memberCount - cancelledMemberCount);
      
      // Total Cost based on ACTIVE members
      const totalCost = tripPrice * effectiveMemberCount;
      
      const paidAmount = parseFloat(bookingJson.amount); // Net Paid (from DB)
    
      return {
        ...bookingJson,
        totalCost,
        paidAmount,
        activeMemberCount: effectiveMemberCount, // Useful for frontend
        memberCount: bookingJson.memberCount, // Total members (historical)
        tripAdvanceAmount: parseFloat(bookingJson.Trip.advanceAmount)
      };
    });

    // Calculate Trip Summary
    let totalCustomers = 0;
    let fullyPaidCustomers = 0;
    let advancePaidCustomers = 0;
    let totalCollected = 0;
    let totalPending = 0;

    formattedBookings.forEach(b => {
      totalCustomers += b.activeMemberCount; // User defined logic might vary, but active customers makes sense for summary
      totalCollected += b.paidAmount; // Net collected
      
      const pending = b.totalCost - b.paidAmount; // Cost(Active) - NetPaid
      if (pending > 0) totalPending += pending;

      if (pending <= 0) {
          fullyPaidCustomers += b.activeMemberCount;
      } else if (b.paidAmount > 0) {
          advancePaidCustomers += b.activeMemberCount;
      }
    });

  if (tripId) {
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

    const tripPrice = parseFloat(bookingJson.Trip.price);
    
    // 1. Calculate Active Cost
    const cancelledMemberCount = bookingJson.Customers.filter(c => c.status === 'cancelled').length;
    const effectiveMemberCount = Math.max(0, bookingJson.memberCount - cancelledMemberCount);
    const totalCost = tripPrice * effectiveMemberCount;

    // 2. Calculate Gross Paid & Refund from Payments Array
    // (Since booking.amount is Net, we derive Gross from payments for display if requested)
    let grossPaid = 0;
    let refundAmount = 0;

    if (bookingJson.Payments) {
        bookingJson.Payments.forEach(p => {
            const amt = parseFloat(p.amount);
            if (p.paymentType === 'refund') {
                refundAmount += amt;
            } else {
                grossPaid += amt;
            }
        });
    }

    // 3. Net Paid (should match booking.amount roughly)
    const netPaid = grossPaid - refundAmount;

    // 4. Remaining Amount (Balance to pay OR Surplus)
    // Formula: What they should pay (active cost) - What they have currently paid (net)
    const remainingAmount = totalCost - netPaid;

    return {
      ...bookingJson,
      totalCost,         // Cost of ACTIVE members
      paidAmount: grossPaid, // Historical Total Paid (as requested)
      refundAmount,      // Total Refunded
      netPaidAmount: netPaid, // Money currently held
      remainingAmount    // Positive = Due, Negative = Surplus/Refundable
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
      const memberCount = booking.memberCount;
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

    // 5. Check if Fully Paid -> Update Status
    // Re-fetch or calculate cost. We have Trip and Customers.
    const tripPrice = parseFloat(booking.Trip.price);
    // Count ONLY active members for cost threshold
    const cancelledMemberCount = booking.Customers.filter(c => c.status === 'cancelled').length;
    const effectiveMemberCount = Math.max(0, booking.memberCount - cancelledMemberCount);
    const totalCost = tripPrice * effectiveMemberCount;

    // Use tolerance for float comparison
    if (newTotalAmount >= totalCost - 0.01 && booking.status !== BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.PARTIAL_CANCELLED) {
        // Only auto-confirm if not cancelled/partial
        if (booking.status === BOOKING_STATUS.PENDING) {
             await booking.update({ status: BOOKING_STATUS.CONFIRMED }, { transaction });
        }
    }

    await transaction.commit();

    return await getBookingById(bookingId, partnerId);
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

const cancelBookingMembers = async (bookingId, data, partnerId) => {
  const transaction = await sequelize.transaction();
  try {
    const { memberIds, refundAmount, cancellationReason, paymentMethod, paymentDate, screenshotUrl } = data;

    // 1. Fetch Booking with Customers
    const booking = await Booking.findOne({
      where: { id: bookingId, partnerId },
      include: [{ model: Customer }],
      transaction
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    // 2. Validate Members
    const invalidMembers = memberIds.filter(id => !booking.Customers.find(c => c.id === id));
    if (invalidMembers.length > 0) {
        throw new Error(`Invalid member IDs: ${invalidMembers.join(', ')}`);
    }

    // 3. Update Status of Selected Members
    await Customer.update(
        { status: 'cancelled' },
        { where: { id: memberIds }, transaction }
    );

    // 4. Record Refund Payment (if any)
    if (refundAmount && refundAmount > 0) {
        await Payment.create({
            bookingId: booking.id,
            amount: refundAmount, // Stored as positive number
            method: paymentMethod,
            paymentType: 'refund',
            transactionId: null, // or pass if collected
            status: 'completed',
            paymentDate: paymentDate || new Date(),
            screenshotUrl: screenshotUrl || null
        }, { transaction });

        // 5. Update Booking Amount (Net Paid)
        // If we want booking.amount to represent "Net Amount Held", we SUBTRACT refund.
        const newTotal = parseFloat(booking.amount) - parseFloat(refundAmount);
        await Booking.update({ amount: newTotal }, { where: { id: bookingId }, transaction });
    }

    // 6. Check if ALL members are cancelled
    const currentParamMembers = new Set(memberIds);
    // Count active members: existing active ones minus the ones we just cancelled
    // Actually, safer to re-query or check memory state.
    // Let's use logic:
    const activeMembersCount = booking.Customers.filter(c =>
        c.status === 'active' && !currentParamMembers.has(c.id)
    ).length;

    let newStatus = booking.status;
    if (activeMembersCount === 0) {
        newStatus = BOOKING_STATUS.CANCELLED;
    } else {
        newStatus = BOOKING_STATUS.PARTIAL_CANCELLED;
    }

    await Booking.update({ status: newStatus }, { where: { id: bookingId }, transaction });

    await transaction.commit();
    return await getBookingById(bookingId, partnerId);

  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  addPaymentToBooking,
  cancelBookingMembers,
};
