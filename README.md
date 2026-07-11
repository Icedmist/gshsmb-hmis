# GSHSMB Hospital Management Information System (HMIS)

A centralized Hospital Services Management Information System for the Gombe State Hospital Services Management Board.

## Architecture

```
Board (GSHSMB)
  ├── Hospitals
  │   ├── Departments
  │   │   └── Employees
  │   └── ...
  └── ...
```

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Recharts
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT + RBAC

## User Roles

1. **Super Admin** - Full system access
2. **Executive Secretary** - View-only executive oversight
3. **Hospital Admin** - Manage assigned hospital
4. **HR Officer** - Manage employee records & transfers

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## Setup

### 1. Database

```bash
# Create the database
createdb gshsmb_hmis

# Run migrations
cd backend
npm run migrate

# Seed default users
npm run seed
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit database credentials
npm run dev           # Starts on port 5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@gshsmb.gov.ng | Admin@123 |
| Executive Secretary | secretary@gshsmb.gov.ng | Admin@123 |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get profile

### Users (Super Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Hospitals
- `GET /api/hospitals` - List hospitals
- `GET /api/hospitals/:id` - Get hospital
- `POST /api/hospitals` - Create hospital (Super Admin)
- `PUT /api/hospitals/:id` - Update hospital (Super Admin)

### Departments
- `GET /api/departments` - List departments
- `GET /api/departments/:id` - Get department
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department

### Employees
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `POST /api/employees/:id/transfer` - Transfer employee
- `GET /api/employees/transfers` - List transfers

### Dashboard
- `GET /api/dashboard/stats` - Summary stats
- `GET /api/dashboard/employees-per-hospital` - Chart data
- `GET /api/dashboard/employees-per-department` - Chart data
- `GET /api/dashboard/recent-activities` - Recent audit logs
- `GET /api/dashboard/recent-employees` - Recent employees
- `GET /api/dashboard/recent-transfers` - Recent transfers

### Audit Logs (Super Admin only)
- `GET /api/audit-logs` - List audit logs

## License

Gombe State Hospital Services Management Board
