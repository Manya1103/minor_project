// routes/expenses.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const ocrService = require("../services/ocr");
const categorizationService = require("../services/categorization");

// ------------------------------
// Multer setup for file uploads
// ------------------------------
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/receipts";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only jpeg, png, or pdf are allowed."),
        false
      );
    }
  },
});

// ------------------------------
// POST /api/expenses
// Create expense manually
// ------------------------------
router.post("/", auth, async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      vendor,
      date,
      paymentMethod,
      tags,
      notes,
    } = req.body;

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory && (description || vendor)) {
      finalCategory = categorizationService.categorize(
        `${description || ""} ${vendor || ""}`,
        amount
      );
    }

    const expense = new Expense({
      user: req.user._id,
      amount,
      category: finalCategory || "other",
      description,
      vendor,
      date: date || Date.now(),
      paymentMethod,
      tags,
      notes,
    });

    await expense.save();

    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error("💥 Expense creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// POST /api/expenses/scan
// Scan receipt and create expense
// ------------------------------
router.post("/scan", auth, upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    console.log("📄 Processing receipt:", req.file.path);

    // Process receipt via OCR
    const ocrResult = await ocrService.processReceipt(req.file.path);
    // console.log(ocrResult);
    if (!ocrResult.success) {
      console.error("❌ OCR failed:", ocrResult.error);
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message:
          ocrResult.error ===
          "Mindee API: Authorization required. Check your API key."
            ? "Authorization error: please verify your Mindee API key."
            : "Failed to process receipt.",
        ocrError: ocrResult.error,
      });
    }

    const extractedData = ocrResult.extracted_ocr_data;

    // Create expense entry
    const expense = new Expense({
      user: req.user._id,
      amount: extractedData.amount || 0,
      category: extractedData.category || "other",
      vendor: extractedData.vendor || "Unknown",
      date: extractedData.date || Date.now(),
      receiptImage: req.file.path,
      description: `Scanned receipt - ${extractedData.vendor || "Unknown"}`,
    });

    await expense.save();

    res.status(201).json({
      success: true,
      expense,
      ocrData: extractedData,
    });
  } catch (error) {
    console.error("💥 Receipt scan error:", error);
    if (req.file) {
      await fs
        .unlink(req.file.path)
        .catch(() => console.error("Failed to delete temp file after error"));
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// GET /api/expenses
// Fetch all user expenses
// ------------------------------
router.get("/", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
    } = req.query;

    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("💥 Fetch expenses error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// GET /api/expenses/:id
// ------------------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, expense });
  } catch (error) {
    console.error("💥 Get expense by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// PUT /api/expenses/:id
// ------------------------------
router.put("/:id", auth, async (req, res) => {
  try {
    let expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    Object.assign(expense, req.body);
    await expense.save();

    res.json({ success: true, expense });
  } catch (error) {
    console.error("💥 Update expense error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// DELETE /api/expenses/:id
// ------------------------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    if (expense.receiptImage) {
      await fs
        .unlink(expense.receiptImage)
        .catch((err) =>
          console.error("Failed to delete receipt image:", err.message)
        );
    }

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("💥 Delete expense error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------
// POST /api/expenses/categorize
// ------------------------------
router.post("/categorize", auth, async (req, res) => {
  try {
    const { text, amount } = req.body;
    const category = categorizationService.categorize(text, amount);
    const tags = categorizationService.suggestTags(text);
    res.json({ success: true, category, tags });
  } catch (error) {
    console.error("💥 Categorization error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
