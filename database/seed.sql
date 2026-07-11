-- GSHSMB HMIS Seed Data
-- Run this AFTER schema.sql has been executed.
-- Password for all default accounts: Admin@123
-- Generate a real hash with: node -e "require('bcryptjs').hash('Admin@123',10).then(console.log)"

INSERT INTO users (full_name, email, phone_number, password_hash, role, status)
SELECT 'Super Admin', 'admin@gshsmb.gov.ng', '08000000000', '$2a$10$8KzQMGx5C5Kc5Qy5Q5z5Q.5Q5z5Q5y5Q5z5Q5y5Q5z5Q5y5Q5z5Q', 'super_admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gshsmb.gov.ng');
