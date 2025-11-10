const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const predictionService = require("../services/prediction");

// @route   GET /api/analytics/summary
// @desc    Get expense summary
// @access  Private
router.get("/summary", auth, async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const expenses = await Expense.find({
      user: req.user._id,
    });

    // Calculate totals
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    // Category breakdown
    const byCategory = {};
    expenses.forEach((exp) => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { total: 0, count: 0 };
      }
      byCategory[exp.category].total += exp.amount;
      byCategory[exp.category].count += 1;
    });

    // Daily trend
    const dailyTrend = {};
    expenses.forEach((exp) => {
      const dateKey = exp.date.toISOString().split("T")[0];
      if (!dailyTrend[dateKey]) {
        dailyTrend[dateKey] = 0;
      }
      dailyTrend[dateKey] += exp.amount;
    });

    res.json({
      success: true,
      summary: {
        total: Math.round(total),
        count,
        average: Math.round(average),
        period,
        byCategory,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get spending trends
// @access  Private
router.get("/trends", auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Monthly trends
    const monthlyTrends = {};
    expenses.forEach((exp) => {
      const monthKey = `${exp.date.getFullYear()}-${String(
        exp.date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {
          total: 0,
          count: 0,
          byCategory: {},
        };
      }
      monthlyTrends[monthKey].total += exp.amount;
      monthlyTrends[monthKey].count += 1;

      if (!monthlyTrends[monthKey].byCategory[exp.category]) {
        monthlyTrends[monthKey].byCategory[exp.category] = 0;
      }
      monthlyTrends[monthKey].byCategory[exp.category] += exp.amount;
    });

    // Calculate growth rate
    const monthKeys = Object.keys(monthlyTrends).sort();
    let growthRate = 0;
    if (monthKeys.length >= 2) {
      const lastMonth = monthlyTrends[monthKeys[monthKeys.length - 1]].total;
      const prevMonth = monthlyTrends[monthKeys[monthKeys.length - 2]].total;
      growthRate =
        prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
    }

    res.json({
      success: true,
      trends: {
        monthly: monthlyTrends,
        growthRate: Math.round(growthRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/predictions
// @desc    Get expense predictions
// @access  Private
router.get("/predictions", auth, async (req, res) => {
  try {
    const predictions = await predictionService.predictNextMonthExpenses(
      req.user._id
    );

    res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/top-expenses
// @desc    Get top expenses
// @access  Private
router.get("/top-expenses", auth, async (req, res) => {
  try {
    const { limit = 10, period = "month" } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const topExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate },
    })
      .sort({ amount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      topExpenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/comparison
// @desc    Compare current vs previous period
// @access  Private
router.get("/comparison", auth, async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: currentMonthStart },
    });

    const lastMonthExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const currentTotal = currentMonthExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const lastTotal = lastMonthExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const difference = currentTotal - lastTotal;
    const percentChange = lastTotal > 0 ? (difference / lastTotal) * 100 : 0;

    res.json({
      success: true,
      comparison: {
        current: {
          total: Math.round(currentTotal),
          count: currentMonthExpenses.length,
        },
        previous: {
          total: Math.round(lastTotal),
          count: lastMonthExpenses.length,
        },
        difference: Math.round(difference),
        percentChange: Math.round(percentChange * 100) / 100,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
