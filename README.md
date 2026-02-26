# DigitMonie Records

A comprehensive **loan management system** built for microfinance businesses to track customers, issue loans, manage repayments, and monitor profits — all through a modern web dashboard.

🔗 **Live:** [records.digitmonie.com](https://records.digitmonie.com)

---

## Features

### 📊 Dashboard
- Overview stats: total customers, active loans, total disbursed, total profit
- Recent loans and activity at a glance

### 👥 Customer Management
- Add, edit, and delete customers
- Customer profiles with loan history
- Search and filter customers

### 💰 Loan Management
- Create loans with **reducing balance** amortization
- Loan type templates (e.g. Standard, Personal) with preset rates
- Custom loans with flexible interest rates and periods
- Live calculation preview before issuing
- Full repayment schedule with monthly breakdown
- Edit and delete loans
- Track loan status: Active, Completed, Defaulted

### 📅 Repayment Tracking
- Mark individual repayments as paid/unpaid
- Auto-complete loans when all payments are made
- Visual progress bar for each loan

### 🔧 Loan Types
- Create reusable loan templates
- Configure: interest rate, period (monthly/annually), duration, admin fee %

### 👤 User & Role Management
- Three roles: **Admin**, **Staff**, **Viewer**
- Admins: full access (create users, delete records)
- Staff: create/edit loans and customers
- Viewers: read-only dashboard access

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS with CSS variables |
| **Backend** | PHP (vanilla, no framework) |
| **Database** | SQLite |
| **Auth** | JWT (custom implementation) |

---

## Project Structure

```
digitmonie-records/
├── api/                        # Backend API
│   ├── config/
│   │   ├── cors.php            # CORS configuration
│   │   └── database.php        # SQLite connection + auto-migration
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── CustomerController.php
│   │   ├── DashboardController.php
│   │   ├── LoanController.php
│   │   ├── LoanTypeController.php
│   │   ├── RepaymentController.php
│   │   └── UserController.php
│   ├── helpers/
│   │   └── LoanCalculator.php  # Reducing balance EMI calculation
│   ├── middleware/
│   │   └── auth.php            # JWT auth + role middleware
│   ├── index.php               # API router
│   └── .htaccess               # URL rewriting
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Modal, Sidebar, Toast
│   │   ├── layouts/            # DashboardLayout
│   │   ├── lib/
│   │   │   └── api.js          # API client
│   │   ├── pages/              # All page components
│   │   ├── styles/
│   │   │   └── globals.css     # Design system
│   │   ├── App.jsx             # Router
│   │   └── main.jsx            # Entry point
│   └── vite.config.js
│
└── .gitignore
```

---

## Getting Started

### Prerequisites
- **PHP 7.4+** with SQLite extension
- **Node.js 18+** and npm

### Backend Setup
```bash
# The API uses SQLite — no database setup needed
# Tables are auto-created on first request
# Default admin: admin@digitmonie.com / admin123
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development server on :5173
npm run build        # Production build to dist/
```

### Environment Variables
Create `frontend/.env` for the API URL:
```
VITE_API_URL=http://localhost:8000/api
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/me` | Get current user |
| `GET/POST` | `/customers` | List / Create customers |
| `GET/PUT/DELETE` | `/customers/:id` | View / Update / Delete customer |
| `GET/POST` | `/loans` | List / Create loans |
| `GET/PUT/DELETE` | `/loans/:id` | View / Update / Delete loan |
| `PUT` | `/loans/:id/status` | Update loan status |
| `POST` | `/loans/calculate` | Preview loan calculation |
| `GET/POST` | `/loan-types` | List / Create loan types |
| `PUT` | `/repayments/:id/pay` | Mark repayment as paid |
| `PUT` | `/repayments/:id/unpay` | Revert payment |
| `GET` | `/dashboard` | Dashboard statistics |
| `GET/POST` | `/users` | List / Create users |
| `PUT/DELETE` | `/users/:id` | Update / Delete user |

---

## Loan Calculation

Uses the **reducing balance method** (EMI formula):

```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)

Where:
  P = Principal amount
  r = Monthly interest rate
  n = Number of months
```

Each monthly payment splits into:
- **Interest component** = Outstanding balance × monthly rate
- **Principal component** = EMI − Interest

The balance reduces each month, resulting in decreasing interest and increasing principal portions over time.

---

## License

Private project — all rights reserved.
