const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateBookingPDF = async (bookingData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fillColor('#219653').fontSize(20).text('Booking Confirmation', { align: 'center' });
            doc.moveDown();

            // Trip Info
            doc.fillColor('#000000').fontSize(14).text(`Trip: ${bookingData.Trip.title}`);
            doc.fontSize(12).text(`Destination: ${bookingData.Trip.destination}`);
            doc.text(`Date: ${new Date(bookingData.Trip.startDate).toLocaleDateString()}`);
            doc.moveDown();

            // Booking Details
            doc.fontSize(14).text('Booking Details', { underline: true });
            doc.fontSize(12).text(`Booking ID: ${bookingData.id}`);
            doc.text(`Member Count: ${bookingData.activeMemberCount}`);
            doc.text(`Status: ${bookingData.status.toUpperCase()}`);
            doc.moveDown();

            // Financials
            doc.fontSize(14).text('Financial Summary', { underline: true });
            doc.fontSize(12).text(`Total Amount: INR ${bookingData.totalCost.toLocaleString()}`);
            doc.text(`Paid Amount: INR ${bookingData.netPaidAmount.toLocaleString()}`);
            doc.text(`Remaining: INR ${bookingData.remainingAmount.toLocaleString()}`);
            doc.moveDown();

            // Participants
            doc.fontSize(14).text('Participants', { underline: true });
            bookingData.Customers.filter(c => c.status !== 'cancelled').forEach((customer, index) => {
                doc.fontSize(10).text(`${index + 1}. ${customer.name} (${customer.gender}, ${customer.age}y)`);
            });

            doc.moveDown();
            doc.fontSize(10).fillColor('#666666').text('Thank you for choosing Unzolo!', { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

const generatePaymentPDF = async (bookingData, paymentData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fillColor('#219653').fontSize(20).text('Payment Receipt', { align: 'center' });
            doc.moveDown();

            // Receipt Info
            doc.fillColor('#000000').fontSize(14).text(`Receipt for Trip: ${bookingData.Trip.title}`);
            doc.fontSize(12).text(`Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`);
            doc.moveDown();

            // Payment Details
            doc.fontSize(14).text('Payment Details', { underline: true });
            doc.fontSize(12).text(`Payment Amount: INR ${parseFloat(paymentData.amount).toLocaleString()}`);
            doc.text(`Method: ${paymentData.method.toUpperCase()}`);
            doc.text(`Type: ${paymentData.paymentType.toUpperCase()}`);
            if (paymentData.transactionId) doc.text(`Transaction ID: ${paymentData.transactionId}`);
            doc.moveDown();

            // Balance Info
            doc.fontSize(14).text('Booking Balance', { underline: true });
            doc.fontSize(12).text(`Total Trip Cost: INR ${bookingData.totalCost.toLocaleString()}`);
            doc.text(`Net Paid So Far: INR ${bookingData.netPaidAmount.toLocaleString()}`);
            doc.fillColor('#ff0000').text(`Pending Balance: INR ${bookingData.remainingAmount.toLocaleString()}`);
            
            doc.moveDown();
            doc.fontSize(10).fillColor('#666666').text('This is an auto-generated receipt.', { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateBookingPDF,
    generatePaymentPDF
};
