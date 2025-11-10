const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  monthlyContribution: {
    type: Number,
    default: 0
  },
  description: String
}, {
  timestamps: true
});

// Calculate monthly contribution on save
goalSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('targetAmount') || this.isModified('deadline')) {
    const now = new Date();
    const monthsRemaining = Math.max(1, Math.ceil((this.deadline - now) / (1000 * 60 * 60 * 24 * 30)));
    this.monthlyContribution = Math.ceil((this.targetAmount - this.currentAmount) / monthsRemaining);
  }
  next();
});

goalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
