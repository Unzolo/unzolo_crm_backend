const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Create expense (with optional receipt upload)
router.post('/', upload.single('receipt'), expenseController.createExpense);

// Get all expenses for a trip
router.get('/trip/:tripId', expenseController.getExpensesByTrip);

// Get expense analytics for a trip
router.get('/trip/:tripId/analytics', expenseController.getExpenseAnalytics);

// Get single expense
router.get('/:id', expenseController.getExpenseById);

// Update expense (with optional receipt upload)
router.put('/:id', upload.single('receipt'), expenseController.updateExpense);

// Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
