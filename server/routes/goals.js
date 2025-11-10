const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const Expense = require('../models/Expense');

// @route   POST /api/goals
// @desc    Create financial goal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, targetAmount, deadline, category, priority, description } = req.body;

    const goal = new Goal({
      user: req.user._id,
      title,
      targetAmount,
      deadline,
      category,
      priority,
      description
    });

    await goal.save();

    // Calculate budget recommendations
    const recommendations = await calculateBudgetRecommendations(req.user._id, goal);

    res.status(201).json({
      success: true,
      goal,
      recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/goals
// @desc    Get all goals for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal.toObject(),
      progress: (goal.currentAmount / goal.targetAmount) * 100,
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))
    }));

    res.json({ success: true, goals: goalsWithProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({ success: true, goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      goal[key] = updates[key];
    });

    await goal.save();

    res.json({ success: true, goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to goal
// @access  Private
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.json({
      success: true,
      goal,
      progress: (goal.currentAmount / goal.targetAmount) * 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/goals/:id/recommendations
// @desc    Get budget recommendations for goal
// @access  Private
router.get('/:id/recommendations', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const recommendations = await calculateBudgetRecommendations(req.user._id, goal);

    res.json({ success: true, recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate budget recommendations
async function calculateBudgetRecommendations(userId, goal) {
  try {
    // Get last 3 months expenses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Expense.find({
      user: userId,
      date: { $gte: threeMonthsAgo }
    });

    // Calculate average monthly spending by category
    const categorySpending = {};
    expenses.forEach(exp => {
      if (!categorySpending[exp.category]) {
        categorySpending[exp.category] = [];
      }
      categorySpending[exp.category].push(exp.amount);
    });

    const avgCategorySpending = {};
    Object.entries(categorySpending).forEach(([category, amounts]) => {
      avgCategorySpending[category] = amounts.reduce((a, b) => a + b, 0) / 3; // 3 months avg
    });

    // Calculate total average monthly spending
    const totalAvgSpending = Object.values(avgCategorySpending).reduce((a, b) => a + b, 0);

    // Calculate months remaining
    const monthsRemaining = Math.max(1, Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24 * 30)));

    // Calculate required monthly savings
    const requiredMonthlySavings = (goal.targetAmount - goal.currentAmount) / monthsRemaining;

    // Generate recommendations
    const recommendations = {
      requiredMonthlySavings: Math.round(requiredMonthlySavings),
      currentMonthlySpending: Math.round(totalAvgSpending),
      targetMonthlySpending: Math.round(totalAvgSpending - requiredMonthlySavings),
      savingsGap: Math.round(requiredMonthlySavings),
      categoryReductions: []
    };

    // Suggest category-wise reductions (prioritize non-essential categories)
    const nonEssentialCategories = ['entertainment', 'shopping', 'dining', 'travel'];
    const potentialSavings = [];

    nonEssentialCategories.forEach(category => {
      if (avgCategorySpending[category]) {
        const reduction = avgCategorySpending[category] * 0.2; // Suggest 20% reduction
        potentialSavings.push({
          category,
          currentSpending: Math.round(avgCategorySpending[category]),
          suggestedReduction: Math.round(reduction),
          newBudget: Math.round(avgCategorySpending[category] - reduction)
        });
      }
    });

    recommendations.categoryReductions = potentialSavings;

    // Add insights
    recommendations.insights = [];
    
    if (requiredMonthlySavings > totalAvgSpending * 0.3) {
      recommendations.insights.push({
        type: 'warning',
        message: 'Goal requires significant lifestyle changes. Consider extending the deadline or reducing the target.'
      });
    } else if (requiredMonthlySavings < totalAvgSpending * 0.1) {
      recommendations.insights.push({
        type: 'success',
        message: 'Goal is easily achievable with minor adjustments!'
      });
    }

    const totalPotentialSavings = potentialSavings.reduce((sum, item) => sum + item.suggestedReduction, 0);
    if (totalPotentialSavings >= requiredMonthlySavings) {
      recommendations.insights.push({
        type: 'success',
        message: `By reducing non-essential spending, you can save ₹${Math.round(totalPotentialSavings)}/month.`
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Recommendation calculation error:', error);
    return {};
  }
}

module.exports = router;
