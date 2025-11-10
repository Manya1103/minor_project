# PocketPilot API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: Same as register
```

### Get Current User
```
GET /auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "INR"
  }
}
```

## Expenses

### Create Expense
```
POST /expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 500,
  "category": "food",
  "description": "Lunch at restaurant",
  "vendor": "Restaurant Name",
  "date": "2024-10-14",
  "paymentMethod": "card"
}

Response:
{
  "success": true,
  "expense": {
    "_id": "expense_id",
    "amount": 500,
    "category": "food",
    ...
  }
}
```

### Scan Receipt (OCR)
```
POST /expenses/scan
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- receipt: [image file]

Response:
{
  "success": true,
  "expense": { ... },
  "ocrData": {
    "amount": 500,
    "date": "2024-10-14",
    "vendor": "Store Name",
    "category": "food"
  }
}

Note: Uses Mindee API for enterprise-grade OCR processing.
Supports JPG, PNG, and PDF formats.
```

### Get All Expenses
```
GET /expenses?startDate=2024-10-01&endDate=2024-10-31&category=food
Authorization: Bearer {token}

Query Parameters:
- startDate (optional)
- endDate (optional)
- category (optional)
- minAmount (optional)
- maxAmount (optional)
- page (default: 1)
- limit (default: 50)

Response:
{
  "success": true,
  "expenses": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 2
  }
}
```

### Update Expense
```
PUT /expenses/:id
Authorization: Bearer {token}

{
  "amount": 600,
  "category": "food"
}
```

### Delete Expense
```
DELETE /expenses/:id
Authorization: Bearer {token}
```

### Categorize Text (Get Suggestion)
```
POST /expenses/categorize
Authorization: Bearer {token}

{
  "text": "Paid rent to landlord",
  "amount": 15000
}

Response:
{
  "success": true,
  "category": "rent",
  "tags": ["rent", "landlord", "housing"]
}
```

## Goals

### Create Goal
```
POST /goals
Authorization: Bearer {token}

{
  "title": "Buy a Laptop",
  "targetAmount": 50000,
  "deadline": "2025-04-01",
  "category": "shopping",
  "priority": "high",
  "description": "Save for new laptop"
}
```

### Get All Goals
```
GET /goals?status=active
Authorization: Bearer {token}

Query: status (active, completed, cancelled)
```

### Contribute to Goal
```
POST /goals/:id/contribute
Authorization: Bearer {token}

{
  "amount": 5000
}
```

### Get Goal Recommendations
```
GET /goals/:id/recommendations
Authorization: Bearer {token}

Response:
{
  "success": true,
  "recommendations": {
    "requiredMonthlySavings": 10000,
    "currentMonthlySpending": 30000,
    "targetMonthlySpending": 20000,
    "categoryReductions": [...]
  }
}
```

### Update Goal
```
PUT /goals/:id
Authorization: Bearer {token}
```

### Delete Goal
```
DELETE /goals/:id
Authorization: Bearer {token}
```

## Analytics

### Get Summary
```
GET /analytics/summary?period=month
Authorization: Bearer {token}

Query: period (week, month, year)

Response:
{
  "success": true,
  "summary": {
    "total": 25000,
    "count": 45,
    "average": 555,
    "byCategory": {
      "food": { "total": 5000, "count": 10 },
      ...
    },
    "dailyTrend": { ... }
  }
}
```

### Get Trends
```
GET /analytics/trends?months=6
Authorization: Bearer {token}

Response:
{
  "success": true,
  "trends": {
    "monthly": {
      "2024-10": {
        "total": 25000,
        "count": 45,
        "byCategory": { ... }
      }
    },
    "growthRate": 5.2
  }
}
```

### Get Predictions
```
GET /analytics/predictions
Authorization: Bearer {token}

Response:
{
  "success": true,
  "predictions": {
    "predictions": {
      "regular": {
        "rent": {
          "predicted": 15000,
          "trend": "stable"
        }
      },
      "irregular": {
        "celebration": {
          "probability": 0.7,
          "predictedAmount": 5000
        }
      },
      "byCategory": { ... },
      "total": 35000
    },
    "confidence": "high",
    "insights": [...]
  }
}
```

### Get Top Expenses
```
GET /analytics/top-expenses?limit=10&period=month
Authorization: Bearer {token}
```

### Get Comparison
```
GET /analytics/comparison
Authorization: Bearer {token}

Response:
{
  "success": true,
  "comparison": {
    "current": { "total": 25000, "count": 45 },
    "previous": { "total": 23000, "count": 40 },
    "difference": 2000,
    "percentChange": 8.7
  }
}
```

## Voice Assistant

### Process Voice Command
```
POST /voice/command
Authorization: Bearer {token}

{
  "transcript": "add 50 rupees for groceries"
}

Response:
{
  "success": true,
  "action": "add_expense",
  "expense": { ... },
  "response": "Added ₹50 for food"
}
```

Supported commands:
- "Add 50 rupees for groceries"
- "How much did I spend on food last month?"
- "Show my spending summary"
- "Spent 200 on transport"

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP
- Applies to all /api/* routes

## Notes

1. All amounts are in Indian Rupees (₹)
2. Dates in ISO format (YYYY-MM-DD)
3. Token expires in 30 days by default
4. OCR processing may take 5-10 seconds
5. Voice API requires HTTPS in production
