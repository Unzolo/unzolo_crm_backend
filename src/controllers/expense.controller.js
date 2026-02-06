const { Expense, Trip } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { success, error } = require('../utils/response');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { tripId, category, description, amount, date, paidBy, notes } = req.body;

    // Verify trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return error(res, 'Trip not found', 404);
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

    return success(res, expense, 'Expense created successfully', 201);
  } catch (err) {
    console.error('Error creating expense:', err);
    return error(res, 'Failed to create expense');
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

    return success(res, {
      expenses,
      summary: {
        total: totalExpenses,
        byCategory: totalsByCategory,
        count: expenses.length,
      },
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return error(res, 'Failed to fetch expenses');
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
      return success(res, {
        total: 0,
        byCategory: {},
        count: 0,
        averagePerDay: 0,
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

    return success(res, {
      total,
      byCategory,
      count: expenses.length,
      averagePerDay,
      dateRange: {
        start: minDate,
        end: maxDate,
        days: daysDiff,
      },
    });
  } catch (err) {
    console.error('Error fetching expense analytics:', err);
    return error(res, 'Failed to fetch analytics');
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, date, paidBy, notes } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return error(res, 'Expense not found', 404);
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

    return success(res, expense, 'Expense updated successfully');
  } catch (err) {
    console.error('Error updating expense:', err);
    return error(res, 'Failed to update expense');
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return error(res, 'Expense not found', 404);
    }

    // Delete receipt file if exists
    if (expense.receipt) {
      const filePath = path.join(__dirname, '../../uploads', expense.receipt);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await expense.destroy();

    return success(res, null, 'Expense deleted successfully');
  } catch (err) {
    console.error('Error deleting expense:', err);
    return error(res, 'Failed to delete expense');
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
      return error(res, 'Expense not found', 404);
    }

    return success(res, expense);
  } catch (err) {
    console.error('Error fetching expense:', err);
    return error(res, 'Failed to fetch expense');
  }
};
