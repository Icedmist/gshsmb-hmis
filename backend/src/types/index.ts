export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  EXECUTIVE_SECRETARY = 'executive_secretary',
  HOSPITAL_ADMIN = 'hospital_admin',
  HR_OFFICER = 'hr_officer',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  firebase_uid: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  hospital_id: string | null;
  avatar_url?: string;
  status: EntityStatus;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface Hospital {
  id: string;
  hospital_name: string;
  hospital_code: string;
  address: string;
  lga: string;
  contact_email: string;
  contact_phone: string;
  status: EntityStatus;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface Department {
  id: string;
  department_name: string;
  department_code: string;
  description: string;
  hospital_id: string;
  status: EntityStatus;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface Employee {
  id: string;
  staff_id: string;
  full_name: string;
  gender: string;
  phone_number: string;
  email: string;
  position: string;
  department_id: string;
  hospital_id: string;
  employment_date: string;
  status: EmployeeStatus;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface EmployeeTransfer {
  id: string;
  employee_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  from_department_id: string;
  to_department_id: string;
  transfer_date: string;
  reason: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: FirebaseFirestore.Timestamp;
}

export const POSITION_CATEGORIES = [
  'Doctor',
  'Nurse',
  'Pharmacist',
  'Laboratory Personnel',
  'Administrative Staff',
  'Support Staff',
] as const;

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  ip_address: string;
  created_at: FirebaseFirestore.Timestamp;
}

export interface FirebaseJwtPayload {
  uid: string;
  role: UserRole;
  hospital_id: string | null;
  email?: string;
}

export interface TokenUser {
  userId: string;
  role: UserRole;
  hospitalId: string | null;
}
