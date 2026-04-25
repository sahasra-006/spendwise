# 💸 Spendwise — Full-Stack Personal Expense Tracker

A production-grade expense tracking application built with **React + Vite**, **Node.js + Express**, and **MongoDB + Mongoose**, featuring JWT authentication, real-time CRUD, analytics charts, and budget tracking.

---

## 🏗️ Architecture Overview

```
spendwise/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js # Register, login, getMe, updateBudget
│   │   └── expenseController.js # CRUD + Aggregation analytics
│   ├── middleware/
│   │   ├── auth.js           # JWT protect middleware
│   │   ├── errorHandler.js   # Global error + 404 handler
│   │   └── validators.js     # express-validator rules
│   ├── models/
│   │   ├── User.js           # User schema (bcrypt, budget)
│   │   └── Expense.js        # Expense schema (indexes)
│   ├── routes/
│   │   ├── auth.js           # /api/auth/*
│   │   └── expenses.js       # /api/expenses/*
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Express entry point
│
└── frontend/                 # React + Vite + Tailwind
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js  # Axios + interceptors
    │   │   ├── auth.js           # Auth API calls
    │   │   └── expenses.js       # Expense API calls
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── ExpenseItem.jsx
    │   │   │   ├── ExpenseModal.jsx
    │   │   │   └── Spinner.jsx
    │   │   └── layout/
    │   │       ├── AppLayout.jsx
    │   │       ├── ProtectedRoute.jsx
    │   │       └── Sidebar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state (useReducer)
    │   ├── hooks/
    │   │   └── useExpenses.js    # Data-fetching hooks
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── ExpensesPage.jsx
    │   │   ├── BudgetPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── RegisterPage.jsx
    │   ├── utils/
    │   │   └── helpers.js        # Formatters, categories, CSV export
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI
- npm or yarn

---

### 1. Clone & Install

```bash
# Backend
cd spendwise/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend** — copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/spendwise
JWT_SECRET=replace_this_with_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** — copy `.env.example` to `.env`:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** In development, Vite proxies `/api` to `http://localhost:5000`, so the `.env` var is only needed for production builds.

---

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or if using Homebrew on macOS:
brew services start mongodb-community
```

---

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev      # nodemon auto-reloads on changes
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev      # Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | `/auth/register`  | ❌   | Create new user account  |
| POST   | `/auth/login`     | ❌   | Login, receive JWT token |
| GET    | `/auth/me`        | ✅   | Get current user profile |
| PUT    | `/auth/budget`    | ✅   | Update monthly budget    |

### Expense Routes — `/api/expenses`

| Method | Endpoint                  | Auth | Description                              |
|--------|---------------------------|------|------------------------------------------|
| GET    | `/expenses`               | ✅   | List expenses (filter/search/paginate)   |
| POST   | `/expenses`               | ✅   | Create new expense                       |
| GET    | `/expenses/:id`           | ✅   | Get single expense                       |
| PUT    | `/expenses/:id`           | ✅   | Update expense                           |
| DELETE | `/expenses/:id`           | ✅   | Delete expense                           |
| GET    | `/expenses/analytics`     | ✅   | Monthly summary + category breakdown     |

### Query Parameters for `GET /expenses`

| Param      | Type   | Description                        |
|------------|--------|------------------------------------|
| `search`   | string | Full-text search on description    |
| `category` | string | Filter by category name            |
| `month`    | string | Filter by month (YYYY-MM)          |
| `startDate`| string | Date range start (YYYY-MM-DD)      |
| `endDate`  | string | Date range end (YYYY-MM-DD)        |
| `page`     | number | Page number (default: 1)           |
| `limit`    | number | Results per page (default: 20)     |
| `sortBy`   | string | Field to sort by (default: date)   |
| `order`    | string | asc or desc (default: desc)        |

---

## 🗄️ Database Schemas

### User Schema

```js
{
  name:          String   (required, 2–50 chars)
  email:         String   (required, unique, lowercase)
  password:      String   (hashed with bcrypt, select: false)
  monthlyBudget: Number   (default: 0)
  currency:      String   (enum: INR/USD/EUR/GBP, default: INR)
  createdAt:     Date     (auto)
  updatedAt:     Date     (auto)
}
```

### Expense Schema

```js
{
  user:         ObjectId  (ref: User, indexed)
  description:  String    (required, 2–200 chars)
  amount:       Number    (required, > 0, 2 decimal places)
  category:     String    (enum of 10 categories)
  date:         Date      (required)
  notes:        String    (optional, max 500 chars)
  isRecurring:  Boolean   (default: false)
  createdAt:    Date      (auto)
  updatedAt:    Date      (auto)
}

// Compound indexes for fast queries:
// { user, date }
// { user, category }
// { user, date, category }
```

### Expense Categories

```
Food & Dining | Transportation | Bills & Utilities | Entertainment
Health & Medical | Shopping | Education | Travel | Personal Care | Other
```

---

## 🔐 Authentication Flow

1. User registers → password hashed (bcrypt, 12 rounds) → JWT issued
2. JWT stored in `localStorage` on the client
3. Every API request includes `Authorization: Bearer <token>` header
4. `protect` middleware verifies token + confirms user still exists in DB
5. On 401 response → Axios interceptor clears storage and redirects to `/login`

---

## 🎯 Features Checklist

- ✅ JWT Authentication (register / login / protected routes)
- ✅ Expense CRUD (create, read, update, delete)
- ✅ Category-based filtering (10 predefined categories)
- ✅ Full-text search on description
- ✅ Pagination (15 per page, configurable)
- ✅ Sorting (date, amount — asc/desc)
- ✅ Monthly budget with % utilisation
- ✅ Budget alerts (80% warning, 100% exceeded)
- ✅ Dashboard analytics (summary cards, doughnut chart, bar trend)
- ✅ 6-month spending trend chart
- ✅ Category-wise breakdown with progress bars
- ✅ Export all expenses to CSV
- ✅ Responsive layout (sidebar + main content)
- ✅ Loading states and error handling
- ✅ Global toast notifications
- ✅ MongoDB aggregation pipeline for analytics
- ✅ User data isolation (each user sees only their data)

---

## 🛠️ Production Deployment

### Backend (e.g. Railway / Render)
```bash
npm start   # node server.js
```
Set env vars: `MONGO_URI` (Atlas), `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`

### Frontend (e.g. Vercel / Netlify)
```bash
npm run build   # outputs to dist/
```
Set env var: `VITE_API_URL=https://your-api.railway.app/api`

---

## 🧪 Test the API (curl examples)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul","email":"rahul@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul@test.com","password":"secret123"}'

# Add expense (replace TOKEN)
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Grocery","amount":1500,"category":"Food & Dining","date":"2024-01-15"}'

# Get analytics
curl http://localhost:5000/api/expenses/analytics?month=2024-01 \
  -H "Authorization: Bearer TOKEN"
```
