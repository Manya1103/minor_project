const Expense = require('../models/Expense');

class PredictionService {
  /**
   * Predict next month's expenses
   */
  async predictNextMonthExpenses(userId) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      
      // Get historical expenses
      const expenses = await Expense.find({
        user: userId,
        date: { $gte: sixMonthsAgo }
      }).sort({ date: 1 });
      
      if (expenses.length < 10) {
        return {
          predictions: {},
          confidence: 'low',
          message: 'Need more historical data for accurate predictions'
        };
      }
      
      // Analyze regular expenses
      const regularPredictions = this.predictRegularExpenses(expenses);
      
      // Analyze irregular expenses
      const irregularPredictions = this.predictIrregularExpenses(expenses, now);
      
      // Category-wise predictions
      const categoryPredictions = this.predictByCategory(expenses);
      
      return {
        predictions: {
          regular: regularPredictions,
          irregular: irregularPredictions,
          byCategory: categoryPredictions,
          total: this.calculateTotalPrediction(regularPredictions, irregularPredictions)
        },
        confidence: this.calculateConfidence(expenses),
        insights: this.generateInsights(expenses, regularPredictions, irregularPredictions)
      };
    } catch (error) {
      console.error('Prediction Error:', error);
      throw error;
    }
  }

  /**
   * Predict regular recurring expenses
   */
  predictRegularExpenses(expenses) {
    const monthlyAverages = {};
    
    // Group by category
    const categoryExpenses = {};
    expenses.forEach(exp => {
      if (!categoryExpenses[exp.category]) {
        categoryExpenses[exp.category] = [];
      }
      categoryExpenses[exp.category].push(exp);
    });
    
    // Calculate patterns for each category
    Object.entries(categoryExpenses).forEach(([category, catExpenses]) => {
      // Detect recurring patterns
      const isRecurring = this.detectRecurringPattern(catExpenses);
      
      if (isRecurring) {
        const amounts = catExpenses.map(e => e.amount);
        const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const trend = this.calculateTrend(amounts);
        
        monthlyAverages[category] = {
          predicted: Math.round(average * (1 + trend)),
          average: Math.round(average),
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          confidence: 'high'
        };
      }
    });
    
    return monthlyAverages;
  }

  /**
   * Predict irregular expenses (emergencies, celebrations, etc.)
   */
  predictIrregularExpenses(expenses, currentDate) {
    const irregularCategories = ['emergency', 'celebration', 'healthcare', 'travel'];
    const predictions = {};
    
    irregularCategories.forEach(category => {
      const catExpenses = expenses.filter(e => e.category === category);
      
      if (catExpenses.length > 0) {
        // Calculate frequency
        const monthsWithExpense = new Set(
          catExpenses.map(e => `${e.date.getFullYear()}-${e.date.getMonth()}`)
        ).size;
        
        const frequency = monthsWithExpense / 6; // Over last 6 months
        const avgAmount = catExpenses.reduce((sum, e) => sum + e.amount, 0) / catExpenses.length;
        
        // Check for seasonal patterns
        const seasonalFactor = this.checkSeasonalPattern(catExpenses, currentDate);
        
        predictions[category] = {
          probability: Math.min(frequency * seasonalFactor, 0.9),
          predictedAmount: Math.round(avgAmount * seasonalFactor),
          frequency: frequency > 0.5 ? 'frequent' : 'occasional',
          confidence: catExpenses.length > 3 ? 'medium' : 'low'
        };
      }
    });
    
    return predictions;
  }

  /**
   * Predict expenses by category
   */
  predictByCategory(expenses) {
    const categories = {};
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    // Get last two months data
    const recentExpenses = expenses.filter(e => e.date >= twoMonthsAgo);
    
    recentExpenses.forEach(exp => {
      if (!categories[exp.category]) {
        categories[exp.category] = [];
      }
      categories[exp.category].push(exp.amount);
    });
    
    const predictions = {};
    Object.entries(categories).forEach(([category, amounts]) => {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const max = Math.max(...amounts);
      const min = Math.min(...amounts);
      
      predictions[category] = {
        predicted: Math.round(avg),
        range: { min: Math.round(min), max: Math.round(max) },
        count: amounts.length
      };
    });
    
    return predictions;
  }

  /**
   * Detect recurring patterns in expenses
   */
  detectRecurringPattern(expenses) {
    if (expenses.length < 3) return false;
    
    // Check if expenses occur regularly (e.g., monthly)
    const dates = expenses.map(e => e.date).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    
    // Check if intervals are consistent (within 7 days variance)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.every(interval => Math.abs(interval - avgInterval) < 7);
    
    return variance && avgInterval > 20 && avgInterval < 40; // Monthly pattern
  }

  /**
   * Calculate trend (growth rate)
   */
  calculateTrend(amounts) {
    if (amounts.length < 2) return 0;
    
    const first = amounts.slice(0, Math.ceil(amounts.length / 2)).reduce((a, b) => a + b) / Math.ceil(amounts.length / 2);
    const second = amounts.slice(Math.floor(amounts.length / 2)).reduce((a, b) => a + b) / Math.floor(amounts.length / 2);
    
    return (second - first) / first;
  }

  /**
   * Check for seasonal patterns
   */
  checkSeasonalPattern(expenses, currentDate) {
    const currentMonth = currentDate.getMonth();
    
    // Festival months in India (Oct-Dec, Mar-Apr)
    const festivalMonths = [2, 3, 9, 10, 11];
    
    const expensesInSimilarMonths = expenses.filter(e => 
      festivalMonths.includes(e.date.getMonth())
    );
    
    if (festivalMonths.includes(currentMonth) && expensesInSimilarMonths.length > 0) {
      return 1.5; // 50% higher during festival season
    }
    
    return 1.0;
  }

  /**
   * Calculate total predicted expense
   */
  calculateTotalPrediction(regular, irregular) {
    const regularTotal = Object.values(regular).reduce((sum, item) => sum + item.predicted, 0);
    const irregularTotal = Object.values(irregular).reduce((sum, item) => 
      sum + (item.predictedAmount * item.probability), 0
    );
    
    return Math.round(regularTotal + irregularTotal);
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(expenses) {
    if (expenses.length < 20) return 'low';
    if (expenses.length < 50) return 'medium';
    return 'high';
  }

  /**
   * Generate insights based on predictions
   */
  generateInsights(expenses, regular, irregular) {
    const insights = [];
    
    // Check for increasing trends
    Object.entries(regular).forEach(([category, data]) => {
      if (data.trend === 'increasing') {
        insights.push({
          type: 'warning',
          message: `Your ${category} expenses are trending upward. Consider reviewing this category.`
        });
      }
    });
    
    // Check for high probability irregular expenses
    Object.entries(irregular).forEach(([category, data]) => {
      if (data.probability > 0.6) {
        insights.push({
          type: 'info',
          message: `High probability of ${category} expenses next month. Consider setting aside ₹${data.predictedAmount}.`
        });
      }
    });
    
    // Overall spending insight
    const lastMonthTotal = expenses
      .filter(e => {
        const now = new Date();
        return e.date.getMonth() === now.getMonth() - 1 && e.date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    
    const predictedTotal = this.calculateTotalPrediction(regular, irregular);
    
    if (predictedTotal > lastMonthTotal * 1.1) {
      insights.push({
        type: 'warning',
        message: `Predicted expenses are 10% higher than last month. Plan accordingly.`
      });
    }
    
    return insights;
  }
}

module.exports = new PredictionService();
