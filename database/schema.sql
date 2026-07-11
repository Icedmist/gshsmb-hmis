-- GSHSMB Hospital Management Information System
-- PostgreSQL Schema

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS employee_transfers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- HOSPITALS
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  hospital_name VARCHAR(255) NOT NULL,
  hospital_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  lga VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hospitals_code ON hospitals(hospital_code);
CREATE INDEX idx_hospitals_status ON hospitals(status);

-- DEPARTMENTS
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_departments_hospital ON departments(hospital_id);
CREATE INDEX idx_departments_code ON departments(department_code);
CREATE INDEX idx_departments_status ON departments(status);

-- USERS (created before employee_transfers due to FK)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer')),
  hospital_id INTEGER REFERENCES hospitals(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_hospital ON users(hospital_id);
CREATE INDEX idx_users_status ON users(status);

-- EMPLOYEES
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  position VARCHAR(255) NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  employment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employees_staff_id ON employees(staff_id);
CREATE INDEX idx_employees_hospital ON employees(hospital_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);

-- EMPLOYEE TRANSFERS
CREATE TABLE employee_transfers (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  from_hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  to_hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  from_department_id INTEGER NOT NULL REFERENCES departments(id),
  to_department_id INTEGER NOT NULL REFERENCES departments(id),
  transfer_date DATE NOT NULL,
  reason TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employee_transfers_employee ON employee_transfers(employee_id);
CREATE INDEX idx_employee_transfers_date ON employee_transfers(transfer_date);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
