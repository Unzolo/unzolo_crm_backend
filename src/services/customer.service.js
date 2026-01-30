const { Customer, Booking, Trip } = require('../models');

const getCustomers = async (partnerId) => {
  const bookings = await Booking.findAll({
    where: { partnerId },
    include: [
      {
        model: Customer,
        required: true
      },
      {
        model: Trip,
        attributes: ['id', 'title', 'startDate']
      }
    ],
    order: [['bookingDate', 'DESC']]
  });

  const customerMap = new Map();

  bookings.forEach(booking => {
    booking.Customers.forEach(customer => {
      // Group by contact number if provided, otherwise by name (less reliable but fallback)
      const key = customer.contactNumber || `name-${customer.name}`;
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: customer.id, // Just a reference ID
          name: customer.name,
          contactNumber: customer.contactNumber || 'N/A',
          gender: customer.gender,
          age: customer.age,
          totalTrips: 0,
          activeTrips: 0,
          cancelledTrips: 0,
          lastTrip: null,
          trips: []
        });
      }

      const stats = customerMap.get(key);
      stats.totalTrips += 1;
      
      const isCancelled = customer.status === 'cancelled' || booking.status === 'cancelled';
      if (isCancelled) {
        stats.cancelledTrips += 1;
      } else {
        stats.activeTrips += 1;
      }

      // First one encountered is the latest due to DESC order
      if (!stats.lastTrip) {
        stats.lastTrip = {
          tripId: booking.Trip?.id,
          title: booking.Trip?.title || 'Unknown Trip',
          date: booking.bookingDate,
          status: isCancelled ? 'Cancelled' : 'Active'
        };
      }

      stats.trips.push({
        bookingId: booking.id,
        tripId: booking.Trip?.id,
        title: booking.Trip?.title || 'Unknown Trip',
        date: booking.bookingDate,
        status: isCancelled ? 'Cancelled' : 'Active'
      });
    });
  });

  // Sort by name for the list
  return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = {
  getCustomers
};
