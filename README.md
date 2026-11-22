# Spendly — Full-Stack MERN Personal Finance & Expense Manager

Spendly is a modern, production-grade expense management and personal finance tracking application built for a MERN internship assessment. All analytics, dashboard totals, budget alerts, and account balances are computed in real time from stored MongoDB transactions using aggregation pipelines. Data isolation is strictly enforced at the database query level so no user can access another user's financial records.

## 🚀 Live Links

- **Frontend (Vercel):** [https://client-two-omega-68.vercel.app](https://client-two-omega-68.vercel.app)
- **Backend API (Render):** [https://spendly-axn5.onrender.com](https://spendly-axn5.onrender.com)
- **API Health Check:** [https://spendly-axn5.onrender.com/api/v1/health](https://spendly-axn5.onrender.com/api/v1/health)

> **Note on Render Free Tier:** Render spins down free web services after 15 minutes of inactivity. If the app hasn't been accessed recently, the initial API call may take 30–60 seconds while the server wakes up.

---

## ✨ Features

- **Email OTP Verification on Registration:** Fast 6-digit OTP delivery via Gmail SMTP with auto-expiring TTL indexes to verify valid email addresses before account creation.
- **Dynamic Real-Time Dashboard:** Overview of total income, total expenses, net balance, current month budget utilization, recent activity, and 6-month historical income-vs-expense cash flow.
- **Transaction Management:** Full CRUD with income and expense tracking, account association, custom/default categories, notes, transaction dates, receipt attachments, and inline recurring scheduling.
- **Backend Pagination & Combinable Filters:** Server-side pagination (`page`, `limit`), combinable multi-field filters (`type`, `category`, `account`, date ranges, amount ranges), and debounced search with escaped regex.
- **CSV Export with Injection Protection:** Streamlined CSV export mirroring active filters, formatted with standard headers and formula neutralization (`=`, `+`, `-`, `@` escaped).
- **Accounts & Real-Time Balances:** Multiple financial accounts (`Cash`, `Bank Account`, `Credit Card`, `Wallet`, `Savings`). Balances are dynamically aggregated as `sum(income) - sum(expense)`.
- **Intelligent Budgeting & Warning Levels:** Overall monthly budgets and per-category allocations with computed alert states:
  - `< 50%`: `ok` (Normal)
  - `50% - 74%`: `info` (Halfway notice)
  - `75% - 89%`: `warning` (Caution)
  - `90% - 99%`: `danger` (Critical warning)
  - `≥ 100%`: `exceeded` (Over-budget message with overspent dollar amount)
- **Automated Recurring Transactions:** Daily, weekly, monthly, and yearly recurring rules automatically evaluated upon authentication and throttled to once per hour using atomic operations.
- **Savings Goals:** Visual progress tracking towards target amounts and target dates with an interactive "Add Funds" contribution modal.
- **Interactive Analytics:** Breakdown of expenses by category with interactive donut charts and historical cash flow trends grouped by day, week, or month.
- **Mobile-First Responsive Interface:** Collapsible sidebar on desktop, responsive drawer on mobile, accessible focus states, and zero horizontal scroll down to 360px viewport widths.

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express 4 (ES Modules)
- **Database & ODM:** MongoDB Atlas + Mongoose 8
- **Input Validation:** Zod (strict validation middleware on `body`, `query`, and `params`)
- **Authentication & Security:** JWT (`jsonwebtoken`), bcryptjs (12 salt rounds), Helmet, CORS, Express Rate Limit, Morgan
- **Email Delivery:** Nodemailer (Gmail SMTP TLS)
- **File Uploads:** Multer (memory storage) + Cloudinary SDK
- **Testing:** Jest, Supertest, mongodb-memory-server (128 passing tests across 9 suites)

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router 6 (SPA with protected & public route guards)
- **State Management:** Context API + `useReducer` for Auth & Toast notifications
- **Styling:** Tailwind CSS (custom design system tokens) + Lucide React icons
- **Form Handling:** React Hook Form + `@hookform/resolvers/zod`
- **Charts:** Recharts (responsive cash flow bar charts and category donut breakdowns)
- **HTTP Client:** Axios (automatic bearer token injection & 401 session expiration interceptor)
- **Testing:** Vitest + React Testing Library + @testing-library/user-event + jsdom (15 passing tests)

---

## 🏗 Architecture & Request Flow

```
spendly/
├── server/
│   ├── src/
│   │   ├── app.js               # Express application configuration & middleware setup
│   │   ├── server.js            # DB connection bootstrap & HTTP listener
│   │   ├── config/              # env.js (Zod-validated env), db.js (Mongoose connection)
│   │   ├── controllers/         # Thin route handlers
│   │   ├── middleware/          # auth, validate, errorHandler, rateLimiters, notFound
│   │   ├── models/              # User, Account, Category, Transaction, Budget, Goal, RecurringRule, EmailVerification
│   │   ├── routes/              # Modular API route definitions
│   │   ├── services/            # Business logic: analytics, budgetStatus, recurring, csv, email, cloudinary
│   │   ├── utils/               # AppError, asyncHandler, escapeRegex, constants
│   │   ├── validators/          # Strict Zod schemas per endpoint
│   │   └── tests/               # auth, transactions, isolation, accounts, budgets, recurring, csv, otp
│   └── scripts/
│       └── seed.js              # Comprehensive demo dataset seed script
└── client/
    ├── src/
    │   ├── api/                 # Axios client and per-resource API methods
    │   ├── components/          # Reusable UI primitives, Layout, Modals, Charts
    │   ├── context/             # AuthContext, ToastContext
    │   ├── hooks/               # useDebounce, custom data hooks
    │   ├── pages/               # Login, Register, Dashboard, Transactions, Analytics, Accounts, Budgets, Recurring, Goals, Settings
    │   ├── routes/              # ProtectedRoute, PublicRoute
    │   └── tests/               # Frontend component unit tests
    └── vercel.json              # SPA client rewrite rules
```

### Data Isolation & Security Approach
1. **Tenant Filtering:** Every database query filtering user-owned entities is bound strictly to `user: req.user.id`.
2. **404 Over 403:** Attempting to query, update, or delete a resource owned by another user yields a clean `404 Not Found` (rather than a `403 Forbidden`) to prevent resource enumeration and ID fishing.
3. **Strict Validation Pipeline:** No raw `req.body`, `req.query`, or `req.params` ever reaches Mongoose. All inputs are parsed and stripped through Zod `.strict()` schemas.
4. **NoSQL Injection Neutralized:** Primitive-only schemas strictly reject operator injection attacks like `{"$ne": null}`.

---

## 📡 API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Health & attachment service status | No |
| `POST` | `/auth/send-registration-otp` | Send 6-digit verification code to email | No (Rate-limited) |
| `POST` | `/auth/register` | Verify code & create user with default accounts | No (Rate-limited) |
| `POST` | `/auth/login` | Authenticate user & issue JWT | No (Rate-limited) |
| `GET` | `/auth/me` | Fetch currently authenticated user | Yes |
| `POST` | `/auth/logout` | Invalidate client session acknowledgement | Yes |
| `GET` | `/dashboard` | Total balance, income, expenses, budget, recent transactions & chart data | Yes |
| `GET` | `/transactions` | Paginated transaction list with filters & search | Yes |
| `POST` | `/transactions` | Create new transaction (with optional recurring rule) | Yes |
| `GET` | `/transactions/:id` | Get single transaction | Yes |
| `PUT` | `/transactions/:id` | Update transaction details | Yes |
| `DELETE` | `/transactions/:id` | Delete transaction | Yes |
| `GET` | `/transactions/export` | Export filtered transactions to CSV | Yes |
| `POST` | `/transactions/:id/attachment` | Upload receipt image/PDF (max 2 MB) | Yes |
| `GET` | `/categories` | List user custom & system default categories | Yes |
| `POST` | `/categories` | Create custom category | Yes |
| `PUT` | `/categories/:id` | Update custom category | Yes |
| `DELETE` | `/categories/:id` | Delete custom category (409 if in use) | Yes |
| `GET` | `/accounts` | List accounts with aggregated balances & combined net worth | Yes |
| `POST` | `/accounts` | Create financial account | Yes |
| `PUT` | `/accounts/:id` | Rename/update account type | Yes |
| `DELETE` | `/accounts/:id` | Delete account (409 if transactions exist) | Yes |
| `GET` | `/budgets` | Fetch monthly budget status (`?month=YYYY-MM`) | Yes |
| `PUT` | `/budgets/:month` | Upsert overall & per-category budgets | Yes |
| `DELETE` | `/budgets/:month` | Delete budget for a given month | Yes |
| `GET` | `/goals` | List savings goals with computed completion % | Yes |
| `POST` | `/goals` | Create savings goal | Yes |
| `PUT` | `/goals/:id` | Update savings goal | Yes |
| `PATCH` | `/goals/:id/contribute` | Add contribution amount towards goal | Yes |
| `DELETE` | `/goals/:id` | Delete goal | Yes |
| `GET` | `/recurring` | List active recurring rules | Yes |
| `PATCH` | `/recurring/:id` | Pause, resume, or edit recurring rule | Yes |
| `DELETE` | `/recurring/:id` | Delete recurring rule | Yes |
| `GET` | `/analytics` | Range summary, category breakdown, & cash flow trend (`?range=week\|month\|3months\|year`) | Yes |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/spendly?retryWrites=true&w=majority
JWT_SECRET=super-secret-jwt-key-with-minimum-32-characters-for-production
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173,https://client-two-omega-68.vercel.app

# Email OTP Delivery (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-google-app-password

# Optional: Cloudinary Attachments
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend (`client/.env`)
```ini
VITE_API_URL=https://spendly-axn5.onrender.com/api/v1
```

---

## 💻 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Abdullla-Tamboli/spendly.git
cd spendly
```

### 2. Configure Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Gmail SMTP details
npm run dev
```

### 3. Configure Frontend
```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

The frontend will run at `http://localhost:5173` and communicate with the backend at `http://localhost:5000/api/v1`.

### 4. Database Seeding (Development Only)
To seed realistic accounts, 6 months of historical transactions, monthly budgets, goals, and recurring rules for testing:
```bash
cd server
npm run seed
```
This generates credentials for a demo user (`demo@spendly.dev` / `DemoPassword123`) written directly to your MongoDB database.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (128 Tests)
```bash
cd server
npm test
```
Runs Jest against an in-memory MongoDB server covering authentication, Zod validation, user isolation boundaries, transaction filtering, CSV sanitization, budget calculation, and email OTP verification.

### Frontend Component Tests (15 Tests)
```bash
cd client
npm test
```
Runs Vitest and React Testing Library verifying Login, Registration, Transaction forms, Filter interactions, Budget progress bars, and Route protection.

---

## 🛡️ Security Measures

- **Zero Secret Exposure:** All credentials and secrets are kept in `.env` files that are strictly `.gitignore`'d.
- **Bcrypt Password Hashing:** 12 rounds of bcrypt salts with passwords excluded by default (`select: false`).
- **Timing-Attack Resilience:** Login path executes dummy bcrypt comparisons when an email is not found to prevent user enumeration via timing differentials.
- **Strict Zod Parsing:** Prevents Prototype Pollution and NoSQL injection attacks.
- **CSV Formula Neutralization:** Automatically prepends `'` to any cell starting with `=`, `+`, `-`, or `@` to neutralize spreadsheet code injection.
- **Rate Limiting:** Auth endpoints throttled to 10 requests / 15 minutes per IP; API endpoints throttled to 300 requests / 15 minutes per IP.
- **Security Headers:** Enabled via `helmet()`, with `X-Powered-By` disabled.

---

## ⚠️ Known Limitations

1. **Local Storage JWT:** Tokens are saved in client-side `localStorage`. In high-security enterprise environments, `httpOnly` secure cookies with CSRF tokens would be preferred.
2. **Recurring Scheduler:** Recurring rules are processed lazily upon authenticated user requests (throttled to at most once per hour per user) rather than a continuous cron worker daemon.
3. **Attachments:** Transaction receipt uploads require Cloudinary environment variables. If unconfigured, the endpoint responds with `501 Not Implemented` and receipt attachment upload buttons are hidden in the UI.
4. **Render Free Tier Cold Starts:** The backend Web Service automatically spins down during inactivity and may experience a 30–60 second latency on the initial wake-up request.
