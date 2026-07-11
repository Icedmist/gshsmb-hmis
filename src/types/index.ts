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
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  hospital_id: string | null;
  avatar_url?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
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
  created_at: any;
  updated_at: any;
}

export interface Department {
  id: string;
  department_name: string;
  department_code: string;
  description: string;
  hospital_id: string;
  hospital_name?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
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
  department_name?: string;
  hospital_id: string;
  hospital_name?: string;
  employment_date: string;
  status: EmployeeStatus;
  created_at: any;
  updated_at: any;
}

export interface EmployeeTransfer {
  id: string;
  employee_id: string;
  employee_name: string;
  staff_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  from_hospital: string;
  to_hospital: string;
  from_department: string;
  to_department: string;
  transfer_date: string;
  reason: string;
  status: TransferStatus;
  approved_by: string | null;
  approved_by_name?: string;
  created_by: string;
  created_by_name?: string;
  created_at: any;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  ip_address: string;
  created_at: any;
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
  id: string;
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
