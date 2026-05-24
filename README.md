# PayrollPro — MERN Stack Payroll Management System

A full-featured payroll management system built from scratch using the **MERN Stack** (MongoDB, Express.js, React, Node.js).

---

## Features

### Core Modules
- **Dashboard** — Real-time stats, payroll charts by department, recent records
- **Employee Management** — Full CRUD with salary structure, bank details, deductions
- **Payroll Processing** — Auto-generate monthly payroll, pay slip view, mark as paid
- **Attendance Tracking** — Table & grid calendar view, bulk seeding, month-wise summary
- **Department Management** — Create/edit departments, view employee count per dept

### Technical Highlights
- JWT-based authentication with role-based access (Admin / HR / Employee)
- Proportional salary calculation based on attendance
- Automatic deduction of absent-day salary
- Overtime pay calculation
- Payroll state machine: Draft → Processed → Paid
- Responsive dark-themed UI with Recharts visualizations

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, React Router v6, Recharts, Axios |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB with Mongoose ODM         |
| Auth       | JWT (jsonwebtoken) + bcryptjs     |
| Styling    | Pure CSS with CSS Variables       |

---

## Project Structure

```
payroll-system/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── layout/      # Sidebar, Layout
│       │   └── employees/   # EmployeeModal
│       ├── context/         # AuthContext
│       ├── pages/           # All page components
│       └── utils/           # Axios instance
├── server/                  # Express backend
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # Mongoose schemas
│   └── routes/              # API route handlers
├── package.json             # Root scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local) or a MongoDB Atlas URI
- npm

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/payroll-system.git
cd payroll-system
```

### 2. Set up environment variables

Create `server/.env` (copy from `server/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/payroll_db
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:3000
```

### 3. Install dependencies
```bash
# From the root directory:
npm run install-all
```
This installs packages for root, server, and client.

### 4. Run the application
```bash
# Run both frontend and backend concurrently:
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## Demo Data Setup

1. Open http://localhost:3000/login
2. Click **"🌱 Seed Demo Data First"** button — this creates:
   - 5 Departments (Engineering, HR, Finance, Marketing, Operations)
   - 5 Sample Employees with salary structures
   - 2 User accounts (Admin + HR)

### Default Login Credentials

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@payroll.com   | admin123   |
| HR    | hr@payroll.com      | hr12345    |

---

## API Endpoints

### Auth
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /api/auth/login     | Login                |
| POST   | /api/auth/register  | Register user        |
| GET    | /api/auth/me        | Get current user     |
| POST   | /api/auth/seed      | Seed demo data       |

### Employees
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| GET    | /api/employees        | List employees        |
| POST   | /api/employees        | Create employee       |
| GET    | /api/employees/:id    | Get single employee   |
| PUT    | /api/employees/:id    | Update employee       |
| DELETE | /api/employees/:id    | Terminate employee    |

### Payroll
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/payroll                | List payroll records     |
| POST   | /api/payroll/generate       | Generate monthly payroll |
| PUT    | /api/payroll/:id/status     | Update payroll status    |
| PUT    | /api/payroll/:id            | Edit payroll record      |

### Attendance
| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | /api/attendance                    | List records             |
| POST   | /api/attendance                    | Mark attendance          |
| POST   | /api/attendance/bulk               | Bulk mark attendance     |
| GET    | /api/attendance/summary/:empId     | Monthly summary          |
| POST   | /api/attendance/seed               | Seed demo attendance     |

### Departments
| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| GET    | /api/departments        | List departments      |
| POST   | /api/departments        | Create department     |
| PUT    | /api/departments/:id    | Update department     |
| DELETE | /api/departments/:id    | Deactivate department |

### Dashboard
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| GET    | /api/dashboard/stats  | Summary stats     |

---

## Role-Based Access Control

| Feature                    | Admin | HR   | Employee |
|----------------------------|-------|------|----------|
| View Dashboard             | ✅    | ✅   | ✅       |
| View Employees             | ✅    | ✅   | ✅       |
| Add / Edit Employees       | ✅    | ✅   | ❌       |
| Delete / Terminate         | ✅    | ❌   | ❌       |
| Generate Payroll           | ✅    | ✅   | ❌       |
| Mark Attendance            | ✅    | ✅   | ❌       |
| Manage Departments         | ✅    | ❌   | ❌       |

---

## Environment Variables Reference

| Variable     | Description                        | Default                              |
|--------------|------------------------------------|--------------------------------------|
| PORT         | Backend server port                | 5000                                 |
| MONGO_URI    | MongoDB connection string          | mongodb://localhost:27017/payroll_db |
| JWT_SECRET   | Secret key for JWT tokens          | (required — set a strong key)        |
| CLIENT_URL   | Frontend URL for CORS              | http://localhost:3000                |

---

## Git Commit Convention

```
feat: add payroll generation endpoint
fix: correct attendance seeding for weekends
chore: add README and env example
refactor: extract auth middleware
```

---

## Author

Built for the MERN Stack Developer Intern Technical Assessment — Isaii AI.
