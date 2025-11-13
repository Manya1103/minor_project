# 💰 PocketPilot - Your Smart Financial Co-Pilot

> An intelligent, AI-powered MERN stack expense tracker that transforms how you manage your finances.

[![Made with Love](https://img.shields.io/badge/Made%20with-Love-red.svg)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-brightgreen.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo) • [Tech Stack](#️-tech-stack)

---

## 🎯 What is PocketPilot?

PocketPilot is not just another expense tracker - it's your intelligent financial Co-Pilot that:

✨ **Automatically extracts** expense data from receipt photos using OCR  
🤖 **Intelligently categorizes** expenses using AI/ML  
🔮 **Predicts** your future spending patterns  
🎯 **Helps you achieve** financial goals with smart budgeting  
🎤 **Understands** voice commands for hands-free management  

**Perfect for:** Personal finance, budget tracking, goal setting, financial planning

---

## 🌟 Features

### 📷 OCR Receipt Scanning
Upload a receipt photo, and PocketPilot automatically extracts:
- Amount
- Date
- Vendor name
- Line items

**Technology:** Mindee API with advanced image preprocessing

### 🤖 Smart Categorization (AI-Powered)
Goes beyond simple keyword matching with NLP:
- **Example:** "₹12,000 to Green Valley Apartments" → Automatically categorized as "rent"
- **Context-aware:** Understands amount, vendor, description
- **Semantic understanding:** Recognizes variations and related terms

**Technology:** Natural.js + Compromise.js

### 🔮 Predictive Analytics
Forecasts next month's expenses:
- **Regular expenses:** Rent, utilities, subscriptions (based on trends)
- **Irregular expenses:** Medical emergencies, celebrations, travel (based on probability)
- **Seasonal patterns:** Festival expenses, holiday spending
- **Confidence levels:** Based on historical data

### 🎯 Goal-Oriented Budgeting
Set financial goals and get personalized recommendations:
- Automatic monthly contribution calculation
- Category-wise budget reduction suggestions
- Feasibility analysis
- Progress tracking with visual indicators

### 🎤 Voice Assistant (FREE!)
Control with your voice:
- "Add 50 rupees for groceries"
- "How much did I spend on food last month?"
- "Show my spending summary"

**Technology:** Web Speech API (browser built-in)

### 📊 Real-Time Analytics
Beautiful visualizations:
- Category breakdown (pie charts)
- Spending trends (line graphs)
- Predictions vs actual (bar charts)
- Top expenses
- Month-over-month comparison

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

**Option 1: Automated Setup (Recommended)**
```bash
cd PocketPilot

# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh
```

**Option 2: Manual Setup**
```bash
# 1. Install dependencies
npm run install-all

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your MongoDB URI
# MONGO_URI=your_mongodb_connection_string

# 4. Start the application
npm run dev
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

### First Steps
1. Register an account
2. Add your first expense (or scan a receipt!)
3. Set a financial goal
4. Try voice commands
5. Explore analytics

---

## 📚 Documentation

Comprehensive guides available:

| Document | Description |
|----------|-------------|
| [📖 QUICKSTART.md](QUICKSTART.md) | 5-minute setup guide |
| [🏗️ ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture |
| [📋 API_DOCS.md](API_DOCS.md) | API reference |
| [🎨 FEATURES.md](FEATURES.md) | Feature details |
| [🚀 DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |
| [📊 PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Complete overview |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Web Speech API** - Voice commands

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication

### AI/ML
- **Mindee API** - Enterprise-grade OCR engine
- **Natural** - NLP toolkit
- **Compromise** - Text processing
- **Sharp** - Image processing

### Security & Performance
- **Helmet.js** - Security headers
- **bcrypt** - Password hashing
- **express-rate-limit** - Rate limiting
- **Compression** - Response compression

---

## 📸 Screenshots

### Dashboard
Clean, modern interface with real-time insights

### Expense Management
Add expenses manually or scan receipts

### Analytics
Beautiful charts and predictive insights

### Goal Tracking
Visual progress tracking with smart recommendations

---

## 🎯 Use Cases

- 👤 **Personal Finance** - Track daily expenses
- 🎓 **Students** - Manage pocket money
- 💼 **Freelancers** - Track business expenses
- 🏠 **Households** - Family budget management
- 📱 **Small Business** - Basic expense tracking

---

## 🔒 Security

Production-grade security:
- ✅ JWT token authentication
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js security headers
- ✅ Input validation
- ✅ CORS protection
- ✅ Secure file uploads

---

## 🚀 Deployment

Deploy to your favorite platform:

### Quick Deploy Options
- **Heroku** - One-click deploy
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting
- **MongoDB Atlas** - Database hosting
- **Docker** - Containerized deployment
- **VPS** - Full control

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 📊 Project Stats

- **Lines of Code:** 5000+
- **Components:** 15+
- **API Endpoints:** 25+
- **AI Services:** 4
- **Documentation:** 7 comprehensive guides

---

## 🎓 Learning Outcomes

Master these skills:
- ✅ Full-stack MERN development
- ✅ AI/ML integration
- ✅ Enterprise OCR implementation
- ✅ JWT authentication
- ✅ RESTful API design
- ✅ React hooks & context
- ✅ MongoDB optimization
- ✅ Production deployment

---

## 💡 Why PocketPilot?

### What Makes It Special?

1. **Real AI** - Not just buzzwords, actual working ML
2. **Enterprise OCR** - Professional-grade receipt scanning
3. **Production Ready** - Enterprise-grade code
4. **Well Documented** - 7 comprehensive guides
5. **Modern Stack** - Latest technologies
6. **Complete Solution** - All features integrated

### Comparison

| Feature | PocketPilot | Others |
|---------|-------------|--------|
| OCR Scanning | ✅ Enterprise API | ❌ Basic/Paid |
| AI Categorization | ✅ Smart NLP | ❌ Basic keywords |
| Predictions | ✅ Advanced | ❌ Simple average |
| Voice Assistant | ✅ Free | ❌ Not available |
| Goal Budgeting | ✅ Dynamic | ❌ Static |
| Open Source | ✅ Yes | ❌ No |

---

## 🔮 Future Enhancements

Potential additions:
- Export to Excel/PDF
- Email notifications
- Multiple currencies
- Shared expenses
- Investment tracking
- Tax calculations
- Mobile app (React Native)
- Bank integration

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

Built with ❤️ for smart financial management

---

## 🙏 Acknowledgments

Special thanks to:
- Mindee for enterprise-grade OCR API
- Natural & Compromise for NLP
- MongoDB for database
- React team for amazing framework

---

## 📞 Support

Need help?
- 📖 Read [QUICKSTART.md](QUICKSTART.md)
- 🔍 Check [API_DOCS.md](API_DOCS.md)
- 🚀 Review [DEPLOYMENT.md](DEPLOYMENT.md)
- 💬 Open an issue

---

## ⭐ Show Your Support

If you find this project helpful:
- ⭐ Star the repository
- 🍴 Fork it
- 📢 Share it
- 💬 Provide feedback

---

<div align="center">

**PocketPilot** - Your Smart Financial Co-Pilot 💰✨

Made with ❤️ using React, Node.js, MongoDB, and AI

[Get Started](#-quick-start) • [View Docs](#-documentation) • [Deploy Now](#-deployment)

</div>
