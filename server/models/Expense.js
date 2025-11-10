const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "transport",
        "utilities",
        "rent",
        "entertainment",
        "healthcare",
        "shopping",
        "education",
        "travel",
        "personal",
        "celebration",
        "emergency",
        "other",
        "gasoline",
        "groceries",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "netbanking", "other"],
      default: "other",
    },
    receiptImage: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    notes: String,
    extractedData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
