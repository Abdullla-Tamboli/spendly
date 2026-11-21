# AGENTS.md — Spendly (MERN Expense Tracker)

You are building **Spendly**, a full-stack expense management app, for a MERN internship assessment.
Follow this file exactly. Where it is silent, choose the simplest option that satisfies the hard rules.
Work in the milestone order in section 14. After each milestone: run tests, commit, then continue.

---

## 0. Hard rules (violating any of these fails the assessment)

1. Do not copy any existing GitHub expense tracker. Write original code.
2. All data lives in MongoDB. No mock, hard-coded, or in-memory data in the app.
3. Analytics, dashboard totals, budget status, and account balances are **computed from stored transactions** with aggregation queries. Never hard-code or store derived totals.
4. Every protected route is enforced **on the server** with auth middleware. Hiding UI is not protection.
5. **User isolation:** every query on user-owned data filters by `user: req.user.id`. User A must never read, edit, or delete User B's data, even by guessing IDs. Return `404` (not `403`) for another user's resource.
6. Never commit secrets. Use environment variables. Commit `.env.example` only. Add `.env` to `.gitignore`.
7. Never pass raw `req.body` / `req.query` / `req.params` into Mongoose. Validate with Zod first and use only the parsed output.
8. Functional components and hooks only in React. No class components.
9. Backend pagination is mandatory for transaction history. Never fetch the whole collection to the client.
10. Tests are required (backend + frontend). Deployment is required. README is required.

---

## 1. Tech stack (fixed)

**Backend:** Node 20+, Express 4, Mongoose 8, Zod (validation), bcryptjs, jsonwebtoken, helmet, cors, express-rate-limit, morgan, date-fns, multer (attachments), dotenv.
**Backend tests:** Jest, Supertest, mongodb-memory-server.
**Frontend:** React 18 + Vite, React Router 6, Context API + `useReducer` for auth and UI state, axios, Recharts, Tailwind CSS, lucide-react (icons), date-fns, react-hook-form + Zod resolver.
**Frontend tests:** Vitest + React Testing Library + @testing-library/user-event + jsdom.
**Database:** MongoDB Atlas (free tier). Local dev can use Atlas or a local MongoDB.
**Deploy:** Backend on Render, frontend on Vercel.

Use plain JavaScript (ES modules) unless told otherwise.

---

## 2. Repository structure

```
spendly/
├── README.md
├── AGENTS.md
├── .gitignore
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── jest.config.js
│   └── src/
│       ├── app.js                # express app (no listen) — used by tests
│       ├── server.js             # connects DB, listens
│       ├── config/               # env.js (validated env), db.js
│       ├── models/               # User, Account, Transaction, Category, Budget, Goal, RecurringRule
│       ├── routes/               # auth, accounts, transactions, categories, budgets, goals, recurring, analytics, dashboard
│       ├── controllers/
│       ├── services/             # business logic: analytics, budget status, recurring processor, csv
│       ├── middleware/           # auth.js, validate.js, errorHandler.js, rateLimiters.js, notFound.js
│       ├── validators/           # Zod schemas per resource
│       ├── utils/                # AppError, asyncHandler, escapeRegex, constants (default categories)
│       └── tests/                # auth.test.js, transactions.test.js, isolation.test.js, helpers
└── client/
    ├── package.json
    ├── .env.example
    ├── vercel.json               # SPA rewrite
    └── src/
        ├── main.jsx, App.jsx
        ├── api/                  # axios instance + per-resource functions
        ├── context/              # AuthContext, ToastContext
        ├── hooks/                # useDebounce, useTransactions, etc.
        ├── components/           # ui/ (Button, Input, Select, Modal, Card, Badge, Skeleton, EmptyState, ErrorState, ProgressBar), layout/, charts/, forms/
        ├── pages/                # Login, Register, Dashboard, Transactions, Analytics, Accounts, Budgets, Recurring, Goals, Settings
        ├── routes/               # ProtectedRoute, PublicRoute
        ├── utils/                # formatCurrency, categories (icons map), dates
        └── tests/
```

Keep controllers thin. Put business logic in `services/`.

---

## 3. Data models (Mongoose)

All user-owned models have `user: { type: ObjectId, ref: 'User', required: true, index: true }` and `timestamps: true`.

**User**: `name` (2-60), `email` (unique, lowercase, trimmed), `passwordHash` (`select: false`), `currency` (default `USD`), `lastRecurringCheck` (Date).

**Account**: `name` (1-40), `type` enum `cash | bank | credit_card | wallet | savings`. Unique index on `(user, name)`.
Account balance = sum(income) − sum(expense) for that account. No opening balance (keeps totals consistent with `Total Balance = Total Income − Total Expenses`).
On register, auto-create a default `Cash` account and a default `Bank Account`.

**Category** (custom only; defaults live in code constants): `name` (1-30), `type` enum `income | expense`, `icon` (string key from a fixed allowed list, default `tag`). Unique index on `(user, type, name)`.

Default categories:
- Expense: Food, Travel, Shopping, Bills, Rent, Entertainment, Health, Education, Subscription, Other
- Income: Salary, Freelance, Business, Investment, Gift, Other

**Transaction**: `account` (ref, required), `type` enum `income | expense`, `amount` (Number, > 0, max 1e9, max 2 decimals), `category` (string), `note` (max 200, default ''), `date` (Date, default now), `attachment` ({ url, publicId, mimeType } optional), `recurringRule` (ref RecurringRule, optional).
Indexes: `(user, date -1)`, `(user, type, date -1)`, `(user, category, date -1)`, `(user, account, date -1)`.

**RecurringRule**: `account`, `type`, `amount`, `category`, `note`, `frequency` enum `daily | weekly | monthly | yearly`, `nextDate` (Date), `endDate` (optional), `active` (Boolean, default true).
Index: `(active, nextDate)` and `(user, nextDate)`.

**Budget**: `month` (string `YYYY-MM`), `overall` (Number, > 0), `categories` ([{ category, amount }]). Unique index on `(user, month)`.

**Goal**: `name` (1-60), `targetAmount` (> 0), `currentAmount` (>= 0, default 0), `targetDate` (Date). Progress % is computed in the response (`min(100, round(current/target*100))`).

---

## 4. API design

Base path `/api/v1`. JSON only. Auth via `Authorization: Bearer <jwt>`.

Response shape:
- Success: `{ "success": true, "data": ... }` (lists add `"pagination": { page, limit, total, totalPages }`)
- Error: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`

### Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | /health | Health check | No |
| POST | /auth/register | Create user, return token + user | No (rate limited) |
| POST | /auth/login | Login, return token + user | No (rate limited) |
| GET | /auth/me | Current user | Yes |
| POST | /auth/logout | Acknowledge logout (client discards token) | Yes |
| GET | /dashboard | Balance, income, expenses, budget summary, recent transactions, chart data | Yes |
| GET | /transactions | Paginated list with filters + search | Yes |
| POST | /transactions | Create (optionally creates a recurring rule) | Yes |
| GET | /transactions/:id | Get one | Yes |
| PUT | /transactions/:id | Update | Yes |
| DELETE | /transactions/:id | Delete | Yes |
| GET | /transactions/export | CSV export with the same filters | Yes |
| GET | /categories | Default + custom categories for the user | Yes |
| POST | /categories | Create custom category | Yes |
| PUT | /categories/:id | Rename / change icon | Yes |
| DELETE | /categories/:id | Delete (409 if in use) | Yes |
| GET | /accounts | Accounts with computed balances + combined total | Yes |
| POST | /accounts | Create | Yes |
| PUT | /accounts/:id | Update | Yes |
| DELETE | /accounts/:id | Delete (409 if it has transactions) | Yes |
| GET | /budgets?month=YYYY-MM | Budget + computed status for the month | Yes |
| PUT | /budgets/:month | Upsert overall + per-category budgets | Yes |
| DELETE | /budgets/:month | Delete | Yes |
| GET | /goals | List with progress | Yes |
| POST | /goals | Create | Yes |
| PUT | /goals/:id | Update | Yes |
| PATCH | /goals/:id/contribute | Add funds `{ amount }` | Yes |
| DELETE | /goals/:id | Delete | Yes |
| GET | /recurring | List rules | Yes |
| PATCH | /recurring/:id | Pause / resume / edit | Yes |
| DELETE | /recurring/:id | Delete rule | Yes |
| GET | /analytics?range=week\|month\|3months\|year | Summary, category breakdown, trend | Yes |

### Transaction list query params (all validated, all optional, combinable)

`page` (default 1), `limit` (default 20, max 100), `type`, `category` (comma-separated), `account` (id), `from`, `to` (ISO dates, inclusive), `minAmount`, `maxAmount`, `search`, `sort` (`date_desc` default | `date_asc` | `amount_desc` | `amount_asc`).

Search rules: match `note` and `category` with **escaped** case-insensitive regex (use `escapeRegex`); if the search term is numeric, also match `amount` exactly. Build the Mongo filter in a service from validated values only. Never use `$where`, and never spread user input into a query object.

Return transactions populated with account `{ _id, name, type }`.

---

## 5. Business rules

**Dashboard** (`GET /dashboard`): `totalIncome`, `totalExpenses`, `balance = totalIncome − totalExpenses` (all-time), current-month `budget` summary (limit, spent, remaining, percentUsed, level), `recentTransactions` (latest 8), and `overview` chart data (income vs expense for the last 6 months). All via aggregation.

**Budget levels** (computed on the server, return `level` and `message`):
- `< 50%` → `ok`
- `>= 50%` → `info` — "You have used 50% of your {Month} budget."
- `>= 75%` → `warning`
- `>= 90%` → `danger` — "You have used 90% of your {Month} budget."
- `>= 100%` → `exceeded` — "Budget exceeded by ${amount}."
Spent = sum of expenses in that month. Per-category budgets use the same levels, tracked independently.

**Analytics** (`GET /analytics?range=`): returns
- `summary`: `income`, `expenses`, `netSavings` for the range
- `categoryBreakdown`: expense totals by category with percentage share
- `trend`: buckets of income and expense. Buckets: week → by day (7), month → by day, 3months → by week, year → by month. Fill empty buckets with 0.
Use `$match` by user + date range, then `$group`. Use `$dateTrunc` or `$dateToString`.

**Accounts** (`GET /accounts`): each account with `balance` (aggregated), plus `combinedTotal`.

**Recurring**:
- Creating a transaction with `recurring: { enabled: true, frequency, endDate? }` creates the transaction **and** a `RecurringRule` whose `nextDate` is the next occurrence after the transaction date.
- `services/recurring.js` → `processDueRecurring(userId)`: find active rules for the user with `nextDate <= now` (and not past `endDate`); for each, create a transaction at `nextDate`, then advance `nextDate` with date-fns (`addDays`, `addWeeks`, `addMonths`, `addYears`). Loop to catch up missed occurrences (cap 366 iterations per rule). Deactivate when `nextDate > endDate`.
- Use an atomic `findOneAndUpdate` on `nextDate` to avoid duplicate creation on concurrent requests.
- Call `processDueRecurring` on login and in the auth middleware, throttled by `user.lastRecurringCheck` (at most once per hour).
- Generated transactions must not themselves create rules.

**CSV export** (`GET /transactions/export`): same filters as the list, no pagination. Header exactly:
`Date,Type,Category,Account,Amount,Note`
Rows like `2026-07-01,Expense,Food,Cash,25,Lunch`. Date is `YYYY-MM-DD`. Quote fields containing commas, quotes, or newlines. **Prevent CSV injection:** if a text field starts with `=`, `+`, `-`, or `@`, prefix it with a single quote. Respond with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="spendly-transactions.csv"`.

**Categories**: a transaction's category must be a default category for its type or one of the user's custom categories for that type. Reject otherwise with 400.

**Attachments** (optional field): accept `image/jpeg`, `image/png`, `application/pdf`, max 2 MB, via multer memory storage. Upload to Cloudinary if `CLOUDINARY_*` env vars are set. If not configured, the endpoint returns a clear 501 for attachments and the UI hides the attachment field. Document this under Known limitations.

---

## 6. Authentication and security

- Passwords: bcrypt, 12 rounds. Min 8 chars, at least one letter and one number. `passwordHash` has `select: false`. Never return it.
- JWT: payload `{ sub: userId }`, signed with `JWT_SECRET`, expiry from `JWT_EXPIRES_IN` (default `1d`). Verify in `middleware/auth.js`; load the user and attach `req.user`. Return `401` with codes `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`.
- Do not reveal whether an email exists on login failure: always "Invalid email or password". Use a constant-time compare path (still run bcrypt against a dummy hash if the user is missing).
- Rate limiting: auth routes 10 requests / 15 min / IP; all other API routes 300 requests / 15 min / IP. Return the standard error shape.
- `helmet()` on. `app.disable('x-powered-by')`. JSON body limit `10kb`.
- CORS: allow only `CLIENT_ORIGIN` (comma-separated list supported), methods `GET,POST,PUT,PATCH,DELETE`, headers `Content-Type, Authorization`. Never use `*` with credentials.
- Validation: a `validate({ body, query, params })` middleware using Zod `.strict()` schemas on **every** route. Use `z.string().trim()`, bounded lengths, `z.coerce.number()`, ObjectId regex checks. Replace `req.body/query/params` with parsed values.
- NoSQL injection: because Zod only emits primitives we define, operators like `{ "$gt": "" }` are rejected. Add a test proving login with `{ "email": { "$ne": null }, "password": "x" }` returns 400.
- Escape user-provided strings in regex. Never use `$where` or `eval`.
- Centralized error handler (`middleware/errorHandler.js`): handles `AppError`, Zod errors, Mongoose `CastError`/`ValidationError`/duplicate key (11000), JWT errors. Never leak stack traces in production. Add a `notFound` handler.
- Wrap every async handler with `asyncHandler`.

---

## 7. Frontend requirements

### Routes
Public: `/login`, `/register`.
Protected (via `ProtectedRoute`, redirect to `/login` with return path): `/` (Dashboard), `/transactions`, `/analytics`, `/accounts`, `/budgets`, `/recurring`, `/goals`, `/settings`.
`PublicRoute` redirects logged-in users to `/`.

### State
- `AuthContext`: `user`, `token`, `login`, `register`, `logout`, `loading`. Token stored in `localStorage`. On boot, call `/auth/me` to validate.
- axios instance adds the `Authorization` header. A response interceptor on `401` (`TOKEN_EXPIRED` or `INVALID_TOKEN`) clears auth and redirects to `/login` with a "Session expired" toast.
- Server data (transactions, budgets, etc.) is fetched per page with hooks that expose `{ data, loading, error, refetch }`. Do not hold the entire transaction collection client-side.

### Pages
1. **Login / Register**: validated forms (react-hook-form + Zod), inline field errors, server error banner, loading state on submit.
2. **Dashboard**: stat cards (balance, income, expenses, budget remaining, % used), budget progress card with warning message, income-vs-expense chart, recent transactions (8), accounts mini-list, goals preview, quick **Add transaction** button.
3. **Add/Edit transaction modal** (bottom sheet on mobile): Expense/Income segmented control, amount, category (defaults + custom + "Create category" inline), account, date (default today), note, attachment (if enabled), recurring toggle revealing frequency and optional end date.
4. **Transactions**: backend-paginated table (cards on mobile). Columns: category icon, category, note, date, account, amount, income/expense indicator, actions. Filters: type, category, account, date range, amount range. Debounced search (300 ms). Active filters shown as removable chips, "Clear filters". Filters and page are reflected in the URL query string. **Export CSV** button downloads using the current filters (fetch with auth header → blob → download).
5. **Analytics**: range switcher Week | Month | 3 Months | Year; summary cards; donut chart of category breakdown; bar/line chart of the trend; ranked category table.
6. **Accounts**: cards with balance, combined total, add/edit/delete.
7. **Budgets**: overall monthly budget with progress bar and level states (50 / 75 / 90 / 100%+), per-category budgets grid, set-budget modal, month selector.
8. **Recurring**: list of rules, next due date, pause/resume/delete.
9. **Goals**: cards with progress, "Add funds", create/edit/delete.
10. **Settings**: profile, currency, logout.

### UX states (required on every data-driven view)
- **Loading:** skeletons, not blank screens. Disable buttons while submitting.
- **Empty:** friendly message + a primary action (e.g. "Add your first transaction").
- **Error:** inline error with a Retry button.
- Toasts for success/failure of mutations. Confirm dialog before deleting.
- Responsive and mobile-first: sidebar on desktop (≥1024px), top bar + bottom tab bar on mobile. No horizontal scroll at 360px.
- Accessible basics: labels on inputs, focus rings, button `type`, `aria-label` on icon buttons, sufficient contrast.

### Design system (match the Stitch designs in `/design` when provided; otherwise use this)
Configure Tailwind tokens:
- Background `#F6F7F9`, surface `#FFFFFF`, border `#E4E7EC`
- Text: primary `#101828`, secondary `#475467`, muted `#98A2B3`
- Primary `#1E4FD6` (hover `#1A44B8`, tint `#EEF3FF`)
- Income `#12805C` (tint `#E7F6EF`), Expense `#D6403A` (tint `#FDEDEC`), Warning `#B7791F` (tint `#FFF6E0`)
- Font Inter. Tabular numbers for money. 8px spacing grid. Radius: cards 12px, inputs/buttons 8px. Cards use a 1px border, no heavy shadows; shadows only on modals/dropdowns.
- Money format via `Intl.NumberFormat`; expenses shown red with `-`, income green with `+`.
- No gradients, no emojis as icons, no decorative shapes. Use lucide-react icons in tinted rounded tiles.

Charts (Recharts): thin gridlines, tooltips, `ResponsiveContainer`, consistent palette, empty-state fallback when no data.

---

## 8. Testing (required)

### Backend (Jest + Supertest + mongodb-memory-server)
Use `src/app.js` (no listen). Reset DB between tests. Provide helpers `registerAndLogin()`.

**auth.test.js**
- register succeeds, returns token, never returns password/hash
- register rejects duplicate email, weak password, invalid email
- login succeeds; wrong password and unknown email both return the same 401 message
- NoSQL injection payload on login returns 400
- protected route without token → 401 `NO_TOKEN`; with malformed token → 401 `INVALID_TOKEN`; with expired token → 401 `TOKEN_EXPIRED`

**transactions.test.js**
- create / read / update / delete happy paths
- validation: negative amount, unknown category, invalid date, extra fields rejected
- default date is today when omitted
- pagination: `page`, `limit`, `total`, `totalPages` correct; `limit > 100` rejected
- filters combined (type + category + date range + amount range) and search by note/category/amount
- CSV export honours filters, has the exact header, and neutralises `=cmd` injection

**isolation.test.js** (critical)
- User B cannot GET, PUT, or DELETE User A's transaction by ID → 404, and A's data is unchanged
- User B's list never contains A's transactions
- User B cannot create a transaction using A's account ID → 404/400
- Same checks for accounts, goals, and recurring rules

**Also cover:** budget level calculation, analytics aggregates against known fixtures, recurring processor creates the right number of catch-up transactions without duplicates.

### Frontend (Vitest + React Testing Library)
At least these, with mocked API modules:
- `LoginForm`: shows validation errors, submits valid credentials, shows server error
- `TransactionForm`: defaults date to today, validates amount, shows recurring fields when toggled, submits correct payload
- `TransactionList` / filters: renders rows, shows loading, empty, and error states, changing a filter triggers a request with the right params
- `BudgetProgress`: shows the correct message at 50 / 75 / 90 / 100+
- `ProtectedRoute`: redirects to `/login` when unauthenticated

Scripts: `npm test` in both `server` and `client`. All tests must pass before deployment.

---

## 9. Environment variables

**server/.env.example**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/spendly?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
# Optional (attachments)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api/v1
```

`config/env.js` validates required variables with Zod at startup and exits with a clear message if any are missing. In production, refuse to start if `JWT_SECRET` is shorter than 32 characters.

---

## 10. Deployment (required)

1. **MongoDB Atlas:** create a free cluster, a database user, and allow network access for Render (`0.0.0.0/0` is acceptable for this assessment; note it in the README).
2. **Backend on Render (Web Service):** root dir `server`, build `npm install`, start `npm start`, health check path `/api/v1/health`. Set all env vars. `CLIENT_ORIGIN` = the exact Vercel URL (no trailing slash).
3. **Frontend on Vercel:** root dir `client`, framework Vite, set `VITE_API_URL` to the Render URL + `/api/v1`. `vercel.json` must rewrite all routes to `/index.html`.
4. Verify on the live URLs: register → login → add transaction → dashboard shows computed values → filter → export CSV → refresh a deep link (e.g. `/transactions`) without a 404.
5. Note in the README that Render's free tier sleeps and the first request may take about 30-60 seconds.

---

## 11. README.md (required sections)

Project overview, live links (frontend, backend), features, tech stack, architecture (folder structure + request flow + data-isolation approach), API endpoint table (method, path, purpose, auth required), data models summary, setup instructions (clone, install, env, run server + client), environment variables, testing instructions, deployment steps, security measures, screenshots, **Known limitations** (e.g. JWT stored in localStorage; attachments need Cloudinary; recurring runs on login/API access, not a scheduler; free-tier cold starts).

---

## 12. Code quality standards

- ESLint + Prettier configured in both packages; no lint errors at the end.
- Meaningful names, small functions, no dead code, no commented-out blocks, no `console.log` in committed code (use `morgan` and a minimal logger).
- One responsibility per file. Reusable UI components; no copy-pasted markup between pages.
- Money: validate to 2 decimals and round with a helper when returning aggregates.
- Dates: store as UTC `Date`. Treat `from` as start of day and `to` as end of day, inclusive.
- Git: small, meaningful commits (`feat: ...`, `test: ...`, `chore: ...`). Do not commit `node_modules`, `.env`, or build output.

---

## 13. Seed script (development only)

`server/scripts/seed.js` creates a demo user (`demo@spendly.dev` / password from env or printed once) with realistic accounts, transactions across 6 months, a budget, goals, and a recurring rule, **by writing real documents to MongoDB**. It exists to populate screenshots and is not used by the app at runtime. Document it in the README.

---

## 14. Milestones (do in order, commit after each)

1. **Backend foundation:** project setup, env validation, Mongo connection, `app.js`, error handler, `AppError`, `asyncHandler`, `validate` middleware, helmet/CORS/rate limits, health route.
2. **Auth:** User model, register/login/me/logout, JWT middleware, default accounts on register, `auth.test.js`.
3. **Accounts + categories:** models, routes, default categories constant, computed balances.
4. **Transactions:** CRUD, filter builder service, backend pagination, search, `transactions.test.js` and `isolation.test.js`.
5. **CSV export:** service + endpoint + tests.
6. **Budgets + dashboard + analytics:** aggregation services, level logic, tests.
7. **Recurring + goals:** rule model, processor, hooks on login/auth middleware, goals CRUD + contribute, tests.
8. **Frontend foundation:** Vite + Tailwind tokens, UI kit components, layout (sidebar / bottom tabs), routing, AuthContext, axios + interceptors, login/register.
9. **Frontend core:** transactions page (filters, search, pagination, URL sync, CSV), add/edit modal, dashboard.
10. **Frontend features:** analytics, accounts, budgets, recurring, goals, settings. Loading / empty / error states everywhere.
11. **Frontend tests**, lint, responsive pass at 360 / 768 / 1280.
12. **Deploy** Atlas + Render + Vercel, verify the live checklist in section 10.
13. **README, screenshots, final checklist** below.

---

## 15. Definition of done (verify every line before finishing)

- [ ] Register, login, logout work; JWT expiry handled; protected routes enforced on API and frontend
- [ ] Cross-user access returns 404 and is covered by tests
- [ ] Dashboard shows balance, income, expenses, monthly budget, remaining, % used, recent transactions, income-vs-expense chart, quick add
- [ ] Transaction CRUD with all fields, default date today, all default categories, custom categories, recurring toggle, optional attachment
- [ ] History paginated on the backend; combinable filters (type, category, account, date range, amount range); search by note, category, amount
- [ ] Analytics for Week / Month / 3 Months / Year computed from stored data; donut + trend chart
- [ ] Multiple accounts with individual balances and a combined total
- [ ] Overall budget with 50 / 75 / 90 / 100%+ warnings and per-category budgets
- [ ] Recurring (daily / weekly / monthly / yearly) generates next occurrences automatically
- [ ] Savings goals with progress
- [ ] CSV export with the exact header, filters applied, injection-safe
- [ ] MVC structure, Zod validation on every write route, centralized error handler, auth rate limiting
- [ ] NoSQL injection protection verified by a test; CORS restricted; no secrets in git
- [ ] Responsive mobile-first UI with loading, empty, and error states
- [ ] Backend Jest/Supertest tests pass; frontend RTL tests (3+ components) pass
- [ ] Live deployment works end to end against Atlas; `.env.example` files present
- [ ] README complete with API table, setup, env vars, testing, limitations, screenshots
- [ ] GitHub repo is public and contains both `client` and `server`

When something in this file conflicts with a library limitation, pick the closest compliant option, note it in the README under Known limitations, and continue.
