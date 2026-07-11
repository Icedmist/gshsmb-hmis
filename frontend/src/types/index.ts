export type UserRole = 'super_admin' | 'executive_secretary' | 'hospital_admin' | 'hr_officer';
export type EntityStatus = 'active' | 'inactive' | 'suspended';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended';
export type TransferStatus = 'pending' | 'approved' | 'rejected';

export const POSITION_CATEGORIES = [
  'Doctor',
  'Nurse',
  'Pharmacist',
  'Laboratory Personnel',
  'Administrative Staff',
  'Support Staff',
] as const;

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  hospital_id: number | null;
  avatar_url?: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: number;
  hospital_name: string;
  hospital_code: string;
  address: string;
  lga: string;
  contact_email: string;
  contact_phone: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  department_name: string;
  department_code: string;
  description: string;
  hospital_id: number;
  hospital_name?: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  staff_id: string;
  full_name: string;
  gender: string;
  phone_number: string;
  email: string;
  position: string;
  department_id: number;
  department_name?: string;
  hospital_id: number;
  hospital_name?: string;
  employment_date: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTransfer {
  id: number;
  employee_id: number;
  employee_name: string;
  staff_id: string;
  from_hospital_id: number;
  to_hospital_id: number;
  from_hospital: string;
  to_hospital: string;
  from_department: string;
  to_department: string;
  transfer_date: string;
  reason: string;
  status: TransferStatus;
  approved_by: number | null;
  approved_by_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  total_hospitals: number;
  total_departments: number;
  total_employees: number;
  active_employees: number;
}

export interface ChartData {
  id: number;
  name: string;
  value: number;
  [key: string]: any;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  executive_secretary: 'Executive Secretary',
  hospital_admin: 'Hospital Admin',
  hr_officer: 'HR Officer',
};

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'executive_secretary', label: 'Executive Secretary' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'hr_officer', label: 'HR Officer' },
];
