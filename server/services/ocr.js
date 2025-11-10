// services/ocr.js
/**
 * OCR Service - Receipt Processing using Mindee API
 * 
 * This service provides enterprise-grade OCR capabilities for extracting
 * structured data from receipt images using the Mindee API.
 * 
 * Features:
 * - Automatic text extraction from receipts (JPG, PNG, PDF)
 * - Image preprocessing for enhanced accuracy
 * - Structured data extraction (amount, date, vendor, category)
 * - High accuracy with machine learning models
 * 
 * Requirements:
 * - MINDEE_API_KEY: API key from https://platform.mindee.com/
 * - MINDEE_MODEL_ID: (Optional) Custom model ID or default receipt OCR
 * 
 * @module services/ocr
 */

const mindee = require("mindee");
const sharp = require("sharp");
const path = require("path");

class OCRService {
  constructor() {
    this.apiKey = process.env.MINDEE_API_KEY;
    this.modelId = process.env.MINDEE_MODEL_ID;

    if (!this.apiKey) {
      throw new Error(
        "Mindee API key is not set. Please set MINDEE_API_KEY in your environment."
      );
    }
    if (!this.modelId) {
      console.warn(
        "⚠️ Warning: MINDEE_MODEL_ID is not set. The default model will be used."
      );
    }

    try {
      this.client = new mindee.ClientV2({ apiKey: this.apiKey });
    } catch (err) {
      console.error("❌ Failed to initialize Mindee Client:", err.message);
      throw err;
    }
  }

  /**
   * Process a receipt or document and extract data.
   * @param {string} imagePath - Path to the image or PDF file.
   */
  async processReceipt(imagePath) {
    try {
      const isPdf = path.extname(imagePath).toLowerCase() === ".pdf";
      let processedPath = imagePath;

      // Preprocess image if it's not a PDF
      if (!isPdf) {
        processedPath = await this.preprocessImage(imagePath);
      }

      // Set inference parameters
      const inferenceParams = {
        modelId: this.modelId,
        rag: true,
        rawText: true,
        polygon: false,
        confidence: true,
      };

      // Create the input source
      const inputSource = new mindee.PathInput({ inputPath: processedPath });

      // Send for processing
      const response = await this.client.enqueueAndGetInference(
        inputSource,
        inferenceParams
      );

      if (!response || !response.inference) {
        throw new Error("Failed to get inference from Mindee API.");
      }

      // Helper to safely extract primitive values from Mindee Field objects
      const getFieldValue = (name) => {
        try {
          const f = response.inference.result?.fields.get(name);
          if (!f) return null;
          // SimpleField exposes .value, and typed getters stringValue/numberValue
          if (typeof f.value !== "undefined" && f.value !== null)
            return f.value;
          if (typeof f.stringValue !== "undefined") return f.stringValue;
          if (typeof f.numberValue !== "undefined") return f.numberValue;
          // Fallback to toString()
          return f.toString ? f.toString() : null;
        } catch (e) {
          return null;
        }
      };

      const rawDate = getFieldValue("date");
      let parsedDate = null;
      if (rawDate) {
        const d = new Date(rawDate);
        parsedDate = isNaN(d.getTime()) ? null : d;
      }

      const rawAmount =
        getFieldValue("total_net") ??
        getFieldValue("total_amount") ??
        getFieldValue("total");
      const amount =
        typeof rawAmount === "number"
          ? rawAmount
          : rawAmount
          ? Number(String(rawAmount).replace(/[^0-9.-]+/g, ""))
          : null;

      return {
        success: true,
        extracted_ocr_data: {
          date: rawDate,
          vendor:
            getFieldValue("supplier_name") ||
            getFieldValue("merchant_name") ||
            null,
          category:
            getFieldValue("purchase_category") ||
            getFieldValue("category") ||
            null,
          amount: amount,
        },
      };
    } catch (error) {
      console.error("❌ OCR Error:", error.message);
      return {
        success: false,
        error: error.message.includes("Authorization")
          ? "Mindee API: Authorization required. Check your API key."
          : error.message,
      };
    }
  }

  /**
   * Preprocess image (resize, grayscale, normalize, sharpen)
   */
  async preprocessImage(imagePath) {
    const outputPath = imagePath.replace(
      path.extname(imagePath),
      "_processed.jpg"
    );

    await sharp(imagePath)
      .resize(2000, null, { fit: "inside", withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .toFile(outputPath);

    return outputPath;
  }
}

module.exports = new OCRService();
