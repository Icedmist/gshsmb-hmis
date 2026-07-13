export type UserRole = 'super_admin' | 'executive_secretary' | 'hospital_admin' | 'hr_officer' | 'director_medical_services' | 'director_nursing_services' | 'director_prs' | 'director_pharmaceutical_services' | 'director_laboratory_services';
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

// --- Phase 2: Clinical Services ---
export interface ClinicalGuideline {
  id: string;
  title: string;
  code: string;
  department_id: string;
  department_name?: string;
  description: string;
  effective_date: string;
  version: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface ClinicalAudit {
  id: string;
  title: string;
  hospital_id: string;
  hospital_name?: string;
  audit_date: string;
  findings: string;
  recommendations: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface ClinicalAuditFinding {
  id: string;
  audit_id: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  implemented: boolean;
  implemented_at?: string;
  created_at: any;
}

export interface Specialist {
  id: string;
  full_name: string;
  specialty: string;
  hospital_id: string;
  hospital_name?: string;
  department_id: string;
  department_name?: string;
  phone_number: string;
  email: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface SpecialistAssignment {
  id: string;
  specialist_id: string;
  specialist_name?: string;
  hospital_id: string;
  hospital_name?: string;
  department_id: string;
  department_name?: string;
  assigned_date: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface ReferralStatistic {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  referral_count: number;
  incident_type: string;
  reporting_period: string;
  notes: string;
  created_at: any;
  updated_at: any;
}

export interface EmergencyReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  incident_type: string;
  description: string;
  incident_date: string;
  actions_taken: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

// --- Phase 2: Nursing Services ---
export interface NursingWorkforce {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  department_id: string;
  department_name?: string;
  nurse_count: number;
  vacancies: number;
  staffing_gaps: string;
  reporting_period: string;
  created_at: any;
  updated_at: any;
}

export interface NursingAudit {
  id: string;
  audit_name: string;
  hospital_id: string;
  hospital_name?: string;
  department_id: string;
  department_name?: string;
  audit_date: string;
  findings: string;
  recommendations: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface NursingSupervisionReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  department_id: string;
  department_name?: string;
  supervisor_name: string;
  report_date: string;
  findings: string;
  recommendations: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  participants: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface TrainingAttendance {
  id: string;
  program_id: string;
  program_title?: string;
  employee_id: string;
  employee_name?: string;
  attended: boolean;
  certificate_number?: string;
  created_at: any;
}

export interface Certification {
  id: string;
  employee_id: string;
  employee_name?: string;
  certification_name: string;
  issuing_body: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

// --- Phase 2: PRS ---
export interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  actual_value: number;
  unit: string;
  reporting_period: string;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface PerformanceIndicator {
  id: string;
  kpi_id: string;
  kpi_name?: string;
  value: number;
  target: number;
  reporting_period: string;
  notes: string;
  created_at: any;
  updated_at: any;
}

export interface HospitalScorecard {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  period: string;
  type: 'monthly' | 'quarterly' | 'annual';
  total_score: number;
  max_score: number;
  metrics: Record<string, number>;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface DepartmentScorecard {
  id: string;
  department_id: string;
  department_name?: string;
  hospital_id: string;
  hospital_name?: string;
  period: string;
  type: 'monthly' | 'quarterly' | 'annual';
  total_score: number;
  max_score: number;
  metrics: Record<string, number>;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface HospitalStatistic {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  metric_name: string;
  value: number;
  unit: string;
  reporting_period: string;
  created_at: any;
  updated_at: any;
}

export interface ResearchProject {
  id: string;
  title: string;
  principal_investigator: string;
  hospital_id: string;
  hospital_name?: string;
  description: string;
  start_date: string;
  end_date: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface ResearchDocument {
  id: string;
  project_id: string;
  project_title?: string;
  document_name: string;
  document_url: string;
  document_type: string;
  created_at: any;
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  report_category: string;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  parameters: Record<string, any>;
  format: 'pdf' | 'excel';
  url?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

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

// --- Phase 3: Pharmaceutical Services ---
export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  hospital_id?: string;
  hospital_name?: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface EssentialMedicine {
  id: string;
  name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  therapeutic_category: string;
  level: 'primary' | 'secondary' | 'tertiary';
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface PharmaceuticalAudit {
  id: string;
  title: string;
  hospital_id: string;
  hospital_name?: string;
  audit_date: string;
  findings: string;
  recommendations: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface PharmaceuticalAuditFinding {
  id: string;
  audit_id: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  implemented: boolean;
  created_at: any;
}

export interface PharmaceuticalWorkforce {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  pharmacist_count: number;
  pharmacy_technician_count: number;
  vacancies: number;
  staffing_gaps: string;
  reporting_period: string;
  created_at: any;
  updated_at: any;
}

export interface PharmacovigilanceReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  drug_name: string;
  adverse_effect: string;
  severity: 'mild' | 'moderate' | 'severe' | 'fatal';
  reporter_name: string;
  report_date: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface PharmaceuticalQualityReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  report_title: string;
  findings: string;
  recommendations: string;
  report_date: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

// --- Phase 3: Laboratory Services ---
export interface Laboratory {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  lab_name: string;
  lab_type: string;
  equipment_count: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryAudit {
  id: string;
  title: string;
  hospital_id: string;
  hospital_name?: string;
  audit_date: string;
  findings: string;
  recommendations: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryAuditFinding {
  id: string;
  audit_id: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  implemented: boolean;
  created_at: any;
}

export interface LaboratoryWorkforce {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  scientist_count: number;
  technician_count: number;
  vacancies: number;
  staffing_gaps: string;
  reporting_period: string;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryEquipment {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  equipment_name: string;
  model: string;
  serial_number: string;
  status: 'operational' | 'maintenance' | 'faulty' | 'decommissioned';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  created_at: any;
  updated_at: any;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  equipment_name?: string;
  hospital_id: string;
  hospital_name?: string;
  maintenance_type: 'routine' | 'repair' | 'calibration';
  description: string;
  maintenance_date: string;
  performed_by: string;
  cost: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryReagent {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  reagent_name: string;
  lot_number: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  storage_condition: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryCommodity {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface DiseaseSurveillanceReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  disease_name: string;
  case_count: number;
  death_count: number;
  reporting_period: string;
  notes: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface LaboratoryStatistic {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  metric_name: string;
  value: number;
  unit: string;
  reporting_period: string;
  created_at: any;
  updated_at: any;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  executive_secretary: 'Executive Secretary',
  hospital_admin: 'Hospital Admin',
  hr_officer: 'HR Officer',
  director_medical_services: 'Director Medical Services',
  director_nursing_services: 'Director Nursing Services',
  director_prs: 'Director PRS',
  director_pharmaceutical_services: 'Director Pharmaceutical Services',
  director_laboratory_services: 'Director Medical Laboratory Services',
};

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'executive_secretary', label: 'Executive Secretary' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'director_medical_services', label: 'Director Medical Services' },
  { value: 'director_nursing_services', label: 'Director Nursing Services' },
  { value: 'director_prs', label: 'Director PRS' },
  { value: 'director_pharmaceutical_services', label: 'Director Pharmaceutical Services' },
  { value: 'director_laboratory_services', label: 'Director Medical Laboratory Services' },
];
