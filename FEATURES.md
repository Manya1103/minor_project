# PocketPilot - Features Documentation

## 🎯 Core Features

### 1. OCR Receipt Scanning

**Technology:** Mindee API

**How it works:**
1. User uploads receipt image (JPG/PNG/PDF)
2. Image is preprocessed for better accuracy (grayscale, sharpen, normalize)
3. Mindee API processes the image with advanced machine learning models
4. Smart parser extracts:
   - Amount (multiple patterns for ₹, Rs, rupees)
   - Date (various formats)
   - Vendor name (supplier/merchant information)
   - Category suggestions
   - Line items with prices

**Usage:**
- Click "Scan Receipt" button in Expenses page
- Upload receipt photo
- System automatically creates expense with extracted data

**Accuracy Tips:**
- Use clear, well-lit photos
- Ensure receipt is flat and readable
- Avoid shadows and reflections
- Mindee API provides enterprise-grade accuracy

### 2. Smart Categorization (ML + NLP)

**Technology:** Natural.js + Compromise.js

**Intelligent Features:**
- **Semantic Understanding:** Goes beyond exact keyword matching
- **Context Awareness:** Uses amount and vendor context
- **Multi-language Support:** Understands various expressions
- **Learning Capability:** Can learn from user corrections

**How it categorizes:**

1. **Keyword Matching:** Direct matches from extensive keyword database
2. **Stemming:** Recognizes word variations (rent, rented, rental)
3. **Entity Recognition:** Identifies places, businesses, concepts
4. **Amount Heuristics:** 
   - Large amounts (>₹5000) → likely rent
   - Small amounts (<₹1000) → likely food
   - Medium range varies by context
5. **Vendor Pattern Recognition:**
   - "XYZ Apartment" → automatically categorized as rent
   - "ABC Restaurant" → food category
   - "City Hospital" → healthcare

**Supported Categories:**
- Food & Dining
- Transport & Travel
- Utilities (electricity, internet, phone)
- Rent & Housing
- Entertainment & Subscriptions
- Healthcare & Medical
- Shopping & Retail
- Education
- Personal Care
- Celebrations & Events
- Emergency Expenses
- Other

**Example:**
Input: "₹12,000 to Green Valley Apartments"
Output: Category = "rent" (high confidence)

### 3. Predictive Analytics

**Algorithm:** Custom time-series analysis + pattern recognition

**Predicts Two Types of Expenses:**

**A. Regular/Recurring Expenses:**
- Analyzes last 6 months of data
- Identifies recurring patterns (monthly bills, subscriptions)
- Calculates trends (increasing/decreasing)
- Predicts next month amount based on:
  - Historical average
  - Trend direction
  - Seasonal factors

**B. Irregular Expenses:**
- Medical emergencies
- Celebrations (birthdays, weddings)
- Travel
- Home repairs
- Festival expenses

**How it works:**
1. Calculates frequency of irregular expenses
2. Checks for seasonal patterns (festivals, holidays)
3. Estimates probability of occurrence
4. Predicts likely amount if occurs

**Insights Generated:**
- "Your food expenses are trending upward"
- "High probability of celebration expense next month"
- "Predicted spending is 10% higher than last month"

**Confidence Levels:**
- High: 50+ historical transactions
- Medium: 20-49 transactions
- Low: <20 transactions

### 4. Goal-Oriented Budgeting

**Dynamic Budget System:**

**Features:**
1. **Goal Setting:**
   - Set target amount
   - Define deadline
   - Choose priority level

2. **Automatic Calculations:**
   - Monthly contribution required
   - Days remaining
   - Progress percentage

3. **Smart Recommendations:**
   - Analyzes last 3 months spending
   - Identifies non-essential categories
   - Suggests 20% reduction in:
     - Entertainment
     - Shopping
     - Dining out
   - Calculates total potential savings

4. **Budget Adjustment:**
   - Shows current monthly spending
   - Recommends target spending
   - Category-wise reduction plan

**Example Scenario:**
```
Goal: Buy laptop (₹60,000)
Deadline: 6 months
Current savings: ₹10,000

System calculates:
- Required monthly: ₹8,333
- Current spending: ₹30,000/month
- Suggests reducing:
  * Entertainment: ₹2,000 → ₹1,600
  * Shopping: ₹5,000 → ₹4,000
  * Dining: ₹3,000 → ₹2,400
- Total potential savings: ₹9,000/month ✅
```

### 5. Voice Assistant

**Technology:** Web Speech API (Built-in browser feature - FREE!)

**Capabilities:**

**A. Add Expenses:**
- "Add 50 rupees for groceries"
- "Spent 200 on transport"
- "100 rupees for lunch"

**B. Query Spending:**
- "How much did I spend on food last month?"
- "Total spending this week"
- "Show my food expenses"

**C. Get Summaries:**
- "Show spending summary"
- "What are my total expenses?"

**How it works:**
1. User clicks microphone button
2. Browser's speech recognition starts
3. User speaks command
4. System parses command using NLP
5. Executes action (add expense, query data)
6. Responds with voice + text feedback

**Supported Patterns:**
```javascript
// Add expense
"add [amount] rupees for [category]"
"spent [amount] on [category]"

// Query
"how much did I spend on [category]"
"show spending on [category] [period]"
```

**Requirements:**
- HTTPS connection (or localhost for development)
- Microphone permission
- Chrome/Edge/Safari browser

## 🔒 Security Features

1. **Authentication:**
   - JWT token-based
   - Password hashing (bcrypt)
   - Token expiration

2. **API Security:**
   - Rate limiting (100 req/15min)
   - Helmet.js headers
   - CORS protection
   - Input validation

3. **Data Protection:**
   - Secure file uploads
   - File type validation
   - Size limits (10MB)

## 📊 Analytics Dashboard

**Real-time Metrics:**
- Total spending (month/week/year)
- Transaction count
- Average transaction
- Growth rate
- Category breakdown
- Top expenses
- Spending trends (6 months)
- Predictions vs actual

**Visualizations:**
- Pie chart (category distribution)
- Line chart (spending trend)
- Bar chart (predictions)
- Progress bars (goals)

## 🎨 User Experience

**Design Principles:**
- Clean, modern interface
- Responsive (mobile-friendly)
- Fast loading
- Intuitive navigation
- Visual feedback
- Error handling

**Accessibility:**
- Voice commands for hands-free
- Clear visual indicators
- Keyboard navigation support
- Screen reader friendly

## 🚀 Performance Optimizations

1. **Frontend:**
   - Code splitting
   - Lazy loading
   - Optimized images
   - Caching

2. **Backend:**
   - Database indexing
   - Efficient queries
   - Compression
   - Connection pooling

3. **OCR:**
   - Image preprocessing
   - Resolution optimization
   - Async processing

## 💡 Best Practices

**For Users:**
1. Add expenses daily for accuracy
2. Use receipt scanning for convenience
3. Set realistic goals
4. Review predictions monthly
5. Adjust budgets as needed

**For Developers:**
1. Keep dependencies updated
2. Monitor error logs
3. Backup database regularly
4. Test OCR with various receipts
5. Validate user input

## 🔧 Customization

**Easy to customize:**
- Add new categories
- Modify categorization keywords
- Adjust prediction algorithms
- Change UI theme
- Add new voice commands
- Integrate payment gateways

## 📈 Future Enhancements (Possible)

- Export to Excel/PDF
- Email reports
- Multiple currencies
- Shared expenses (family/roommates)
- Bill reminders
- Investment tracking
- Tax calculation
- AI chatbot for financial advice
- Mobile app (React Native)
- Bank account integration

---

**Note:** All features are production-ready and use only free, open-source technologies. No paid APIs or subscriptions required!
