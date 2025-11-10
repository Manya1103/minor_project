# 🏗️ Technical Architecture - PocketPilot

## System Overview

PocketPilot is a full-stack MERN (MongoDB, Express, React, Node.js) application with integrated AI/ML capabilities for intelligent financial management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3000)              │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  │   │
│  │  │Dashboard│  │Expenses│  │ Goals  │  │Analytics │  │   │
│  │  └────────┘  └────────┘  └────────┘  └──────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Voice Assistant (Web Speech API)      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Express Server (Port 5000)                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │   Helmet   │  │Rate Limiter│  │ Compression  │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │    CORS    │  │    Auth    │  │  Validation  │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     ROUTE LAYER                              │
│  ┌──────┐  ┌──────────┐  ┌──────┐  ┌──────────┐  ┌──────┐ │
│  │ Auth │  │ Expenses │  │Goals │  │Analytics │  │Voice │ │
│  └──────┘  └──────────┘  └──────┘  └──────────┘  └──────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (AI/ML)                     │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │      OCR      │  │Categorization│  │   Prediction    │  │
│  │  (Mindee API) │  │(Natural+NLP) │  │  (Time Series)  │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Image Process │  │Voice Command │  │Budget Algorithm │  │
│  │    (Sharp)    │  │    Parser    │  │                 │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MongoDB Database                         │   │
│  │  ┌──────┐  ┌──────────┐  ┌──────┐  ┌────────────┐  │   │
│  │  │Users │  │ Expenses │  │Goals │  │  Indexes   │  │   │
│  │  └──────┘  └──────────┘  └──────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           File System (uploads/receipts)             │   │
│  │            Receipt Images & Processed Data            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: UI framework
- **React Router v6**: Client-side routing
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **date-fns**: Date manipulation
- **Web Speech API**: Voice recognition (browser native)

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **bcrypt**: Password hashing

### AI/ML Libraries
- **Mindee API**: Enterprise-grade OCR engine
- **Natural**: NLP toolkit
- **Compromise**: Text processing
- **Sharp**: Image processing

### Security
- **Helmet.js**: Security headers
- **express-rate-limit**: Rate limiting
- **express-validator**: Input validation
- **CORS**: Cross-origin resource sharing

### Database
- **MongoDB**: NoSQL database
- **Indexes**: Optimized queries

## Data Models

### User Schema
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  currency: String (default: 'INR'),
  monthlyBudget: Number,
  preferences: {
    categoryKeywords: Map,
    voiceEnabled: Boolean
  },
  timestamps: true
}
```

### Expense Schema
```javascript
{
  user: ObjectId (ref: User, indexed),
  amount: Number (required),
  category: String (enum, indexed),
  description: String,
  vendor: String,
  date: Date (indexed),
  paymentMethod: String (enum),
  receiptImage: String,
  isRecurring: Boolean,
  tags: [String],
  extractedData: Object,
  timestamps: true
}

Indexes:
- { user: 1, date: -1 }
- { user: 1, category: 1 }
```

### Goal Schema
```javascript
{
  user: ObjectId (ref: User, indexed),
  title: String (required),
  targetAmount: Number (required),
  currentAmount: Number (default: 0),
  deadline: Date (required),
  category: String,
  priority: String (enum: low/medium/high),
  status: String (enum: active/completed/cancelled),
  monthlyContribution: Number (auto-calculated),
  description: String,
  timestamps: true
}

Index: { user: 1, status: 1 }
```

## AI/ML Components

### 1. OCR Service (ocr.js)

**Purpose:** Extract text and structured data from receipt images

**Process Flow:**
```
Image Upload → Preprocessing → Mindee API Processing → Data Extraction → Validation
```

**Techniques:**
- Grayscale conversion (Sharp)
- Normalization (Sharp)
- Sharpening (Sharp)
- Resolution adjustment (Sharp)
- Mindee API machine learning models
- Pattern matching (regex)

**Output:**
- Amount (with currency detection)
- Date (multiple formats)
- Vendor name (supplier/merchant)
- Category suggestions
- High accuracy with enterprise-grade OCR

### 2. Categorization Service (categorization.js)

**Purpose:** Intelligently categorize expenses using NLP

**Algorithm:**
```
Text Input → Tokenization → Stemming → Entity Recognition → 
Keyword Matching → Context Analysis → Score Calculation → Category
```

**Techniques:**
- **Tokenization:** Break text into words
- **Stemming:** Reduce words to root form
- **TF-IDF:** Term frequency analysis
- **Entity Recognition:** Identify places, organizations
- **Context Scoring:** Amount-based heuristics
- **Keyword Matching:** Extensive dictionary

**Scoring System:**
- Direct keyword match: +10 points
- Stemmed token match: +5 points
- Entity-based bonus: +3 points
- Amount heuristic: +2-5 points

**Learning:**
- User corrections update keyword database
- Adaptive to user patterns

### 3. Prediction Service (prediction.js)

**Purpose:** Forecast future expenses using time-series analysis

**Components:**

**A. Regular Expense Prediction:**
```
Historical Data → Pattern Detection → Trend Analysis → 
Seasonal Adjustment → Future Projection
```

**Techniques:**
- Moving average calculation
- Trend line fitting
- Recurring pattern detection (monthly cycles)
- Growth rate calculation

**B. Irregular Expense Prediction:**
```
Historical Events → Frequency Analysis → Seasonal Patterns → 
Probability Calculation → Amount Estimation
```

**Techniques:**
- Bayesian probability
- Seasonal multipliers (festivals, holidays)
- Event pattern recognition

**Confidence Calculation:**
- High: 50+ transactions
- Medium: 20-49 transactions
- Low: <20 transactions

### 4. Budget Recommendation Engine

**Purpose:** Generate personalized budget recommendations for goals

**Algorithm:**
```
Goal Parameters → Expense Analysis → Category Prioritization → 
Reduction Calculation → Feasibility Check → Recommendations
```

**Calculations:**
1. Required monthly savings = (Target - Current) / Months remaining
2. Current spending analysis (last 3 months)
3. Non-essential category identification
4. Suggested reductions (20% of non-essential)
5. Gap analysis and insights

## API Architecture

### RESTful Endpoints

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

**Expenses:**
- GET /api/expenses (with filters)
- POST /api/expenses
- GET /api/expenses/:id
- PUT /api/expenses/:id
- DELETE /api/expenses/:id
- POST /api/expenses/scan (OCR)
- POST /api/expenses/categorize

**Goals:**
- GET /api/goals
- POST /api/goals
- GET /api/goals/:id
- PUT /api/goals/:id
- DELETE /api/goals/:id
- POST /api/goals/:id/contribute
- GET /api/goals/:id/recommendations

**Analytics:**
- GET /api/analytics/summary
- GET /api/analytics/trends
- GET /api/analytics/predictions
- GET /api/analytics/top-expenses
- GET /api/analytics/comparison

**Voice:**
- POST /api/voice/command

### Request/Response Flow

```
Client Request
    ↓
Rate Limiter Check
    ↓
CORS Validation
    ↓
JWT Authentication (if protected)
    ↓
Input Validation
    ↓
Route Handler
    ↓
Service Layer (AI/ML processing)
    ↓
Database Query
    ↓
Response Formatting
    ↓
Compression
    ↓
Client Response
```

## Security Architecture

### Authentication Flow
```
1. User Registration
   ↓
2. Password Hashing (bcrypt, 12 rounds)
   ↓
3. Store in Database
   ↓
4. User Login
   ↓
5. Password Verification
   ↓
6. Generate JWT Token (30-day expiry)
   ↓
7. Return Token to Client
   ↓
8. Client stores in localStorage
   ↓
9. Include in Authorization header for requests
   ↓
10. Server validates token
```

### Security Layers

1. **Transport Security:**
   - HTTPS in production
   - Secure cookies

2. **Application Security:**
   - Helmet.js headers
   - CSRF protection
   - XSS prevention
   - SQL injection prevention (NoSQL)

3. **API Security:**
   - Rate limiting (100 req/15min)
   - Request validation
   - File upload restrictions
   - Size limits

4. **Data Security:**
   - Password hashing (bcrypt)
   - JWT tokens
   - MongoDB authentication
   - Environment variables

## Performance Optimizations

### Frontend
- Code splitting
- Lazy loading routes
- Memoization (React.memo)
- Debouncing API calls
- Image optimization
- CSS minification

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Response compression (gzip)
- Caching headers
- Efficient algorithms

### Database
- Compound indexes
- Covered queries
- Projection (select specific fields)
- Aggregation pipelines
- Regular index maintenance

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT for authentication (no sessions)
- Separate services possible
- Load balancer ready

### Vertical Scaling
- Efficient algorithms
- Optimized queries
- Resource management
- Memory optimization

### Database Scaling
- Sharding support (MongoDB)
- Replica sets
- Read replicas
- Backup strategies

## Deployment Architecture

### Development
```
Developer Machine
    ↓
npm run dev
    ↓
Backend (localhost:5000) + Frontend (localhost:3000)
    ↓
Local MongoDB
```

### Production (Recommended)
```
GitHub Repository
    ↓
CI/CD Pipeline
    ↓
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │     │   Railway    │     │  MongoDB    │
│  (Frontend) │────▶│   (Backend)  │────▶│   Atlas     │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Monitoring & Logging

### Logs
- Server logs (console)
- Error logs
- Access logs
- OCR processing logs
- Database query logs

### Metrics
- API response times
- Error rates
- User activity
- Database performance
- OCR success rate

## Testing Strategy

### Unit Tests
- Service functions
- Utility functions
- API routes

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User registration/login
- Expense creation
- Receipt scanning
- Voice commands

## Future Architecture Enhancements

1. **Microservices:**
   - Separate OCR service
   - Independent prediction service
   - Isolated voice processing

2. **Caching:**
   - Redis for frequent queries
   - Category caching
   - Prediction caching

3. **Message Queue:**
   - Async OCR processing
   - Background jobs
   - Email notifications

4. **CDN:**
   - Static assets
   - Image optimization
   - Global distribution

5. **Advanced AI:**
   - TensorFlow.js integration
   - Custom ML models
   - Anomaly detection

## Conclusion

PocketPilot's architecture is designed for:
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ Extensibility

All using production-grade, open-source technologies! 🚀
