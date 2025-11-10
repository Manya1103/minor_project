# 🚀 Quick Start Guide - PocketPilot

## Prerequisites
- Node.js v14+ installed
- MongoDB installed (or use MongoDB Atlas)
- Git (optional)

## Installation (5 minutes)

### Step 1: Navigate to Project
```bash
cd "d:\My Projects\New folder\PocketPilot"
```

### Step 2: Install Dependencies
```bash
npm run install-all
```
This installs both backend and frontend dependencies.

### Step 3: Setup Environment
Create a `.env` file in the root directory:
```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your settings:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/pocketpilot
JWT_SECRET=my_super_secret_key_12345
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000

# Mindee API Configuration (Required for OCR)
MINDEE_API_KEY=your_mindee_api_key_here
MINDEE_MODEL_ID=your_model_id_or_leave_empty_for_default
```

**Get Mindee API Key:**
1. Go to https://platform.mindee.com/
2. Sign up for a free account
3. Create a new API key in the dashboard
4. Copy the API key and paste it in `.env`
5. (Optional) Create a custom model or use the default receipt OCR model

**Using MongoDB Atlas (Cloud - Recommended):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create cluster
4. Get connection string
5. Replace `MONGO_URI` with your connection string

### Step 4: Start MongoDB (if using local)
```bash
# Windows
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"

# Linux/Mac
mongod
```

### Step 5: Run the Application
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## First Time Usage

### 1. Register Account
- Open http://localhost:3000
- Click "Register"
- Fill in name, email, password
- Click "Register"

### 2. Add Your First Expense
**Method A: Manual Entry**
- Go to "Expenses" tab
- Click "Add Expense"
- Fill details
- Submit

**Method B: Scan Receipt**
- Click "Scan Receipt"
- Upload a receipt image
- Wait for OCR processing (5-10 seconds)
- Review and confirm

**Method C: Voice Command**
- Click microphone button (bottom right)
- Say: "Add 50 rupees for groceries"
- Confirm with "Allow" when browser asks for mic permission

### 3. Set a Financial Goal
- Go to "Goals" tab
- Click "Set New Goal"
- Example:
  - Title: "Buy a Laptop"
  - Target: ₹60,000
  - Deadline: 6 months from now
  - Priority: High
- Submit
- Click "View Plan" to see budget recommendations

### 4. View Analytics
- Go to "Analytics" tab
- See spending trends
- View predictions
- Analyze category breakdown

## Testing Features

### Test OCR Receipt Scanning
1. Find a receipt or bill
2. Take a clear photo
3. Upload via "Scan Receipt"
4. Verify extracted data

### Test Smart Categorization
Try these entries:
- "₹15,000 to Green Valley Apartments" → Should categorize as "rent"
- "Lunch at Subway" → Should categorize as "food"
- "Metro card recharge" → Should categorize as "transport"
- "Apollo Hospital consultation" → Should categorize as "healthcare"

### Test Voice Assistant
Commands to try:
- "Add 50 rupees for groceries"
- "How much did I spend on food last month?"
- "Show my spending summary"
- "Spent 200 on transport"

### Test Predictions
1. Add at least 10-15 expenses
2. Go to Dashboard
3. View "Next Month Predictions" section
4. See regular and irregular expense forecasts

## Common Commands

```bash
# Install dependencies
npm run install-all

# Start development (both servers)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### MongoDB connection error
- Ensure MongoDB is running
- Check MONGO_URI in .env
- For Atlas: whitelist your IP address

### Voice not working
- Requires HTTPS (or localhost)
- Allow microphone permission
- Use Chrome/Edge/Safari
- Check browser console for errors

### OCR not processing
- Check Mindee API key is set correctly in .env
- Verify API key is valid and active
- Check Mindee account quota/limits
- Check image file size (<10MB)
- Use clear, well-lit images
- Supported formats: JPG, PNG, PDF
- Check server logs for Mindee API errors

### Frontend build errors
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

## Project Structure
```
PocketPilot/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── context/        # React context
├── server/                 # Express backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # AI/ML services
│   ├── middleware/        # Custom middleware
│   └── server.js          # Entry point
├── uploads/               # Receipt images
├── .env                   # Environment variables
└── package.json           # Root dependencies
```

## Next Steps

1. **Explore Features:**
   - Try all expense entry methods
   - Set multiple goals
   - Explore analytics

2. **Add Real Data:**
   - Import your existing expenses
   - Set actual financial goals
   - Track daily spending

3. **Customize:**
   - Modify categories in code
   - Adjust categorization keywords
   - Customize UI colors

4. **Deploy:**
   - See DEPLOYMENT.md for production setup
   - Choose: Heroku, Vercel, AWS, or VPS

## Learning Resources

- **API Documentation:** See API_DOCS.md
- **Feature Details:** See FEATURES.md
- **Deployment Guide:** See DEPLOYMENT.md
- **Main README:** See README.md

## Support

If you encounter issues:
1. Check error in browser console (F12)
2. Check server logs in terminal
3. Review troubleshooting section above
4. Check MongoDB connection
5. Verify .env configuration

## Tips for Best Experience

✅ Add expenses daily for accurate predictions
✅ Use descriptive expense descriptions
✅ Scan receipts for automatic entry
✅ Set realistic financial goals
✅ Review analytics weekly
✅ Use voice commands for quick entry
✅ Keep your MongoDB data backed up

## Demo Credentials (for testing)

After registering, try:
- Email: demo@pocketpilot.com
- Password: demo123456

## What's Included?

✅ Full MERN stack application
✅ OCR receipt scanning (Mindee API)
✅ Smart AI categorization (Natural + Compromise)
✅ Predictive analytics
✅ Goal-based budgeting
✅ Voice assistant (Web Speech API)
✅ Responsive design
✅ Production-ready code
✅ Security features
✅ Comprehensive documentation

---

**Ready to take control of your finances?** Start using PocketPilot now! 💰✨
