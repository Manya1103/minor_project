# 🔄 Migration Guide: Tesseract.js to Mindee API

## Overview

PocketPilot has been upgraded from Tesseract.js to Mindee API for enterprise-grade OCR capabilities. This document outlines the changes and migration steps.

## Why Mindee API?

### Benefits
- ✅ **Higher Accuracy**: Enterprise-grade machine learning models
- ✅ **Better Performance**: Faster processing times
- ✅ **Structured Data**: Returns well-structured JSON responses
- ✅ **Advanced Features**: Category suggestions, confidence scores
- ✅ **Professional Support**: Commercial-grade API with support
- ✅ **Multi-format Support**: Enhanced PDF processing

### Comparison

| Feature | Tesseract.js | Mindee API |
|---------|--------------|------------|
| Accuracy | Good | Excellent |
| Speed | Moderate | Fast |
| Structured Output | Manual parsing | Automatic |
| Setup | Simple | Requires API key |
| Cost | Free | Free tier + Paid |
| Support | Community | Professional |

## Changes Made

### 1. Dependencies
- ❌ Removed: `tesseract.js`
- ✅ Added: `mindee` npm package
- ✅ Kept: `sharp` for image preprocessing

### 2. Environment Variables
New required variables in `.env`:
```env
MINDEE_API_KEY=your_api_key_here
MINDEE_MODEL_ID=optional_custom_model_id
```

### 3. Code Changes

#### OCR Service (`server/services/ocr.js`)
- Replaced Tesseract initialization with Mindee client
- Updated image processing flow
- Enhanced data extraction logic
- Added better error handling for API errors
- Removed commented legacy code

#### API Response Format
```javascript
// Before (Tesseract)
{
  success: true,
  ocrData: {
    amount: 500,
    date: "2024-10-14",
    vendor: "Store Name",
    confidence: 85
  }
}

// After (Mindee)
{
  success: true,
  ocrData: {
    amount: 500,
    date: "2024-10-14",
    vendor: "Store Name",
    category: "food"  // New: automatic category suggestion
  }
}
```

### 4. Documentation Updates
All documentation files updated:
- ✅ README.md
- ✅ API_DOCS.md
- ✅ FEATURES.md
- ✅ ARCHITECTURE.md
- ✅ PROJECT_SUMMARY.md
- ✅ QUICKSTART.md
- ✅ DEPLOYMENT.md

### 5. Cleanup
- Removed `eng.traineddata` file (no longer needed)
- Removed tesseract.js from `package.json`
- Cleaned up commented code in OCR service
- Added comprehensive JSDoc comments

## Migration Steps

### For New Installations

1. **Clone/Download the repository**
2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Get Mindee API Key**
   - Visit https://platform.mindee.com/
   - Sign up for a free account
   - Create an API key in the dashboard
   - Copy the API key

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   MINDEE_API_KEY=your_actual_api_key_here
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

### For Existing Installations

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Remove old dependencies**
   ```bash
   npm uninstall tesseract.js
   cd client && npm uninstall tesseract.js
   cd ..
   ```

3. **Install new dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

4. **Update .env file**
   Add these new lines:
   ```env
   MINDEE_API_KEY=your_mindee_api_key_here
   MINDEE_MODEL_ID=
   ```

5. **Remove old files**
   ```bash
   rm -f eng.traineddata
   ```

6. **Restart the application**
   ```bash
   npm run dev
   ```

## Testing the Migration

### 1. Test OCR Functionality
```bash
# Start the server
npm run dev

# Upload a receipt through the UI
# Go to Expenses > Scan Receipt
# Upload a test receipt image
# Verify data extraction works correctly
```

### 2. Verify API Response
Check that OCR endpoint returns data correctly:
```bash
curl -X POST http://localhost:5000/api/expenses/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "receipt=@test-receipt.jpg"
```

### 3. Check Error Handling
Test with invalid API key to ensure proper error messages:
- Set wrong API key in .env
- Try to scan a receipt
- Should see clear error message about API authorization

## Troubleshooting

### Issue: "Mindee API key is not set"
**Solution**: 
- Check `.env` file has `MINDEE_API_KEY` set
- Restart the server after updating .env
- Verify no typos in the variable name

### Issue: "Authorization required" error
**Solution**:
- Verify API key is valid
- Check API key in Mindee dashboard
- Ensure API key has proper permissions
- Check if free tier quota is exceeded

### Issue: OCR not working after migration
**Solution**:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Verify Mindee package installed:
   ```bash
   npm list mindee
   ```
3. Check server logs for specific errors

### Issue: Package-lock.json still shows tesseract
**Solution**:
- This is normal - lock files contain historical data
- Run `npm install` to update lock file
- Alternatively: delete `package-lock.json` and run `npm install`

## API Key Management

### Free Tier Limits (Mindee)
- 250 pages/month free
- Additional pages available in paid plans
- Check usage in Mindee dashboard

### Best Practices
- Store API key in `.env` file (never commit)
- Use different keys for development/production
- Rotate keys periodically
- Monitor usage in Mindee dashboard

### Production Considerations
- Set API key in deployment environment
- Use environment variables in hosting platform
- Monitor API quota usage
- Set up alerts for quota limits

## Rollback (If Needed)

If you need to rollback to Tesseract.js:

1. **Revert code changes**
   ```bash
   git checkout <previous-commit-hash>
   ```

2. **Reinstall dependencies**
   ```bash
   npm install
   ```

3. **Remove Mindee configuration**
   - Remove MINDEE_* variables from .env

4. **Restart application**

## Support

For issues or questions:
- Check Mindee documentation: https://developers.mindee.com/
- Review API_DOCS.md for endpoint details
- Check server logs for error messages
- Verify .env configuration

## Summary

✅ **Completed**:
- Migrated from Tesseract.js to Mindee API
- Updated all documentation
- Cleaned up code and removed unused files
- Added comprehensive error handling
- Created .env.example template

✅ **Benefits**:
- Higher OCR accuracy
- Better structured data extraction
- Professional-grade API
- Enhanced category detection
- Improved error messages

✅ **Action Required**:
- Get Mindee API key
- Update .env file
- Test OCR functionality

---

**Migration completed successfully! 🎉**

Your PocketPilot now uses enterprise-grade OCR with Mindee API.
