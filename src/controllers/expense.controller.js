const { Expense, Trip } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { tripId, category, description, amount, date, paidBy, notes } = req.body;

    // Verify trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    let receipt = null;
    if (req.file) {
      receipt = req.file.filename;
    }

    const expense = await Expense.create({
      tripId,
      category,
      description,
      amount,
      date: date || new Date(),
      paidBy,
      notes,
      receipt,
    });

    res.status(201).json({
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Failed to create expense', error: error.message });
  }
};

// Get all expenses for a trip
exports.getExpensesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const expenses = await Expense.findAll({
      where: { tripId },
      order: [['date', 'DESC']],
    });

    // Calculate totals by category
    const totalsByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(expense.amount);
      return acc;
    }, {});

    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    res.status(200).json({
      data: {
        expenses,
        summary: {
          total: totalExpenses,
          byCategory: totalsByCategory,
          count: expenses.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};

// Get expense analytics for a trip
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const { tripId } = req.params;

    const expenses = await Expense.findAll({
      where: { tripId },
    });

    if (expenses.length === 0) {
      return res.status(200).json({
        data: {
          total: 0,
          byCategory: {},
          count: 0,
          averagePerDay: 0,
        },
      });
    }

    // Calculate totals by category
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += parseFloat(expense.amount);
      acc[category].count += 1;
      return acc;
    }, {});

    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Calculate date range
    const dates = expenses.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const averagePerDay = daysDiff > 0 ? total / daysDiff : total;

    res.status(200).json({
      data: {
        total,
        byCategory,
        count: expenses.length,
        averagePerDay,
        dateRange: {
          start: minDate,
          end: maxDate,
          days: daysDiff,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching expense analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, date, paidBy, notes } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    let receipt = expense.receipt;
    if (req.file) {
      // Delete old receipt if exists
      if (expense.receipt) {
        const oldPath = path.join(__dirname, '../../uploads', expense.receipt);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      receipt = req.file.filename;
    }

    await expense.update({
      category: category || expense.category,
      description: description || expense.description,
      amount: amount || expense.amount,
      date: date || expense.date,
      paidBy: paidBy !== undefined ? paidBy : expense.paidBy,
      notes: notes !== undefined ? notes : expense.notes,
      receipt,
    });

    res.status(200).json({
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Delete receipt file if exists
    if (expense.receipt) {
      const filePath = path.join(__dirname, '../../uploads', expense.receipt);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await expense.destroy();

    res.status(200).json({
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id, {
      include: [{ model: Trip, attributes: ['id', 'title', 'destination'] }],
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({
      data: expense,
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ message: 'Failed to fetch expense', error: error.message });
  }
};
