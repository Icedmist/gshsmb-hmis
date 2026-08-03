export type UserRole = 'super_admin' | 'executive_secretary' | 'hospital_admin' | 'hr_officer' | 'director_hr' | 'director_medical_services' | 'director_nursing_services' | 'director_prs' | 'director_pharmaceutical_services' | 'director_laboratory_services' | 'director_finance';
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
  hospital_type: string;
  address: string;
  town_city: string;
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

// --- Phase 4: Finance and Accounts ---
export interface Budget {
  id: string;
  budget_year: number;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  category: string;
  approved_amount: number;
  actual_amount: number;
  variance: number;
  status: EntityStatus;
  notes?: string;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  description: string;
  line_item: string;
  approved_amount: number;
  actual_amount: number;
  variance: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface FinancialReport {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  report_category: string;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  period: string;
  content: string;
  total_revenue?: number;
  total_expenditure?: number;
  net_position?: number;
  format: 'pdf' | 'excel';
  url?: string;
  status: EntityStatus;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface RevenueRecord {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  source: string;
  amount: number;
  revenue_date: string;
  description: string;
  reference_number: string;
  status: EntityStatus;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface ExpenditureRecord {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  category: string;
  amount: number;
  expenditure_date: string;
  description: string;
  payment_reference: string;
  payee: string;
  status: EntityStatus;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface PayrollReport {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  period: string;
  total_employees: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: EntityStatus;
  processed_by?: string;
  created_at: any;
  updated_at: any;
}

export interface PayrollHistory {
  id: string;
  payroll_id: string;
  employee_id: string;
  employee_name?: string;
  staff_id?: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  payment_date: string;
  status: EntityStatus;
  created_at: any;
}

export interface TreasuryRecord {
  id: string;
  hospital_id?: string;
  hospital_name?: string;
  transaction_type: 'inflow' | 'outflow' | 'transfer';
  amount: number;
  source: string;
  description: string;
  transaction_date: string;
  balance_after: number;
  reference_number: string;
  status: EntityStatus;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface Asset {
  id: string;
  asset_name: string;
  category_id: string;
  category_name?: string;
  hospital_id: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  description: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  location: string;
  assigned_to?: string;
  status: 'operational' | 'under_maintenance' | 'faulty' | 'decommissioned';
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  depreciation_rate: number;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  asset_name?: string;
  assigned_to: string;
  assigned_to_name?: string;
  department_id?: string;
  department_name?: string;
  assignment_date: string;
  return_date?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  asset_name?: string;
  hospital_id: string;
  hospital_name?: string;
  maintenance_type: 'routine' | 'repair' | 'calibration';
  description: string;
  maintenance_date: string;
  cost: number;
  performed_by: string;
  next_maintenance_date?: string;
  status: EntityStatus;
  created_at: any;
  updated_at: any;
}

export interface ComplianceReport {
  id: string;
  title: string;
  report_type: 'internal_control' | 'audit_recommendation' | 'compliance_status';
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  period: string;
  findings: string;
  recommendations: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved_date?: string;
  created_by?: string;
  created_at: any;
  updated_at: any;
}

export interface FinancialAnalytic {
  id: string;
  analytic_type: 'budget_trend' | 'revenue_trend' | 'expenditure_trend' | 'financial_summary';
  hospital_id?: string;
  hospital_name?: string;
  period: string;
  metrics: Record<string, number>;
  summary: string;
  created_at: any;
  updated_at: any;
}

export interface FinancialDocument {
  id: string;
  report_id?: string;
  hospital_id: string;
  hospital_name?: string;
  document_name: string;
  document_url: string;
  document_type: string;
  notes: string;
  uploaded_by: string;
  created_at: any;
  updated_at: any;
}

export interface FinancialReview {
  id: string;
  report_id?: string;
  hospital_id: string;
  hospital_name?: string;
  report_title?: string;
  request: string;
  response?: string;
  status: 'pending' | 'responded' | 'resolved';
  requested_by: string;
  requested_by_name?: string;
  responded_at?: any;
  created_at: any;
  updated_at: any;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'report_submitted' | 'report_approved' | 'report_rejected' | 'task_assigned' | 'task_completed' | 'deadline_approaching' | 'document_uploaded' | 'circular_published' | 'workflow_update' | 'approval_request' | 'message_received' | 'announcement';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: any;
}

export interface NotificationSetting {
  id: string;
  user_id: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
  types: Record<string, boolean>;
  updated_at: any;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_by: string;
  assigned_by_name?: string;
  hospital_id?: string;
  department_id?: string;
  department_name?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: any;
  completed_at?: any;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: any;
  updated_at: any;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  comment: string;
  created_at: any;
}

export type DocumentStatus = 'draft' | 'published' | 'archived';
export type DocumentType = 'circular' | 'policy' | 'guideline' | 'sop' | 'report' | 'meeting_minutes' | 'audit_report' | 'financial_report' | 'research';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: any;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  version: number;
  status: DocumentStatus;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  approved_by?: string;
  approved_at?: any;
  tags?: string[];
  created_at: any;
  updated_at: any;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  change_notes?: string;
  created_at: any;
}

export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type StepStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'returned';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  entity_type: string;
  entity_id: string;
  initiator_id: string;
  initiator_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  current_reviewer?: string;
  current_reviewer_name?: string;
  next_approver?: string;
  next_approver_name?: string;
  started_at: any;
  completed_at?: any;
  created_at: any;
  updated_at: any;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  name: string;
  assignee_role?: string;
  assignee_id?: string;
  assignee_name?: string;
  status: StepStatus;
  comment?: string;
  time_spent?: number;
  assigned_at: any;
  completed_at?: any;
  created_at: any;
}

export interface WorkflowHistory {
  id: string;
  workflow_id: string;
  step_number: number;
  action: 'submitted' | 'approved' | 'rejected' | 'returned' | 'cancelled' | 'commented';
  user_id: string;
  user_name?: string;
  comment?: string;
  previous_status?: string;
  new_status?: string;
  created_at: any;
}

export interface Approval {
  id: string;
  entity_type: 'report' | 'document' | 'workflow' | 'budget' | 'audit' | 'transfer';
  entity_id: string;
  entity_title?: string;
  requester_id: string;
  requester_name?: string;
  reviewer_id: string;
  reviewer_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  priority: TaskPriority;
  due_date?: any;
  submitted_at: any;
  decided_at?: any;
  created_at: any;
  updated_at: any;
}

export interface ApprovalComment {
  id: string;
  approval_id: string;
  user_id: string;
  user_name?: string;
  comment: string;
  decision?: 'approved' | 'rejected' | 'returned';
  created_at: any;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name?: string;
  sender_hospital_id?: string;
  sender_hospital_name?: string;
  content: string;
  attachments?: { name: string; url: string }[];
  read_by: string[];
  created_at: any;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: string[];
  participant_names?: string[];
  hospital_id?: string;
  department_id?: string;
  is_broadcast: boolean;
  last_message?: string;
  last_message_at?: any;
  last_message_by?: string;
  created_at: any;
  updated_at: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_roles?: string[];
  target_hospitals?: string[];
  created_by: string;
  created_by_name?: string;
  expires_at?: any;
  pinned: boolean;
  created_at: any;
  updated_at: any;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'audit' | 'meeting' | 'training' | 'deadline' | 'board_event' | 'hospital_event' | 'inspection' | 'other';
  start_date: any;
  end_date?: any;
  all_day: boolean;
  location?: string;
  hospital_id?: string;
  hospital_name?: string;
  organizer_id: string;
  organizer_name?: string;
  participants?: string[];
  participant_names?: string[];
  color?: string;
  created_at: any;
  updated_at: any;
}

export interface OrganizationActivity {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_title?: string;
  details?: string;
  previous_status?: string;
  new_status?: string;
  created_at: any;
}

export interface SearchResult {
  id: string;
  entity_type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon?: string;
  hospital_name?: string;
  status?: string;
  created_at?: any;
}

export interface SearchIndex {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  content: string;
  tags: string[];
  hospital_id?: string;
  department_id?: string;
  created_at: any;
  updated_at: any;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  executive_secretary: 'Executive Secretary',
  hospital_admin: 'Hospital Admin',
  hr_officer: 'HR Officer',
  director_hr: 'Director HR',
  director_medical_services: 'Director Medical Services',
  director_nursing_services: 'Director Nursing Services',
  director_prs: 'Director PRS',
  director_pharmaceutical_services: 'Director Pharmaceutical Services',
  director_laboratory_services: 'Director Medical Laboratory Services',
  director_finance: 'Director Finance and Accounts',
          };

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'executive_secretary', label: 'Executive Secretary' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'director_hr', label: 'Director HR' },
  { value: 'director_medical_services', label: 'Director Medical Services' },
  { value: 'director_nursing_services', label: 'Director Nursing Services' },
  { value: 'director_prs', label: 'Director PRS' },
  { value: 'director_pharmaceutical_services', label: 'Director Pharmaceutical Services' },
  { value: 'director_laboratory_services', label: 'Director Medical Laboratory Services' },
  { value: 'director_finance', label: 'Director Finance and Accounts' },
];

// --- Locum Management ---
export type LocumRequestStatus = 'pending_hospital_admin' | 'pending_destination_admin' | 'pending_hr' | 'approved' | 'rejected' | 'cancelled';
export type StaffingRequestStatus = 'open' | 'in_progress' | 'filled' | 'closed';
export type LocumAssignmentStatus = 'active' | 'completed' | 'expired';
export type NominationStatus = 'pending' | 'approved' | 'rejected';

export interface LocumRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  staff_id: string;
  phone_number?: string;
  email?: string;
  source_hospital_id: string;
  source_hospital_name: string;
  destination_hospital_id: string;
  destination_hospital_name: string;
  department: string;
  position: string;
  reason: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  supporting_docs?: string;
  status: LocumRequestStatus;
  current_step: string;
  created_by: string;
  created_at: any;
  updated_at: any;
}

export interface StaffingRequest {
  id: string;
  hospital_id: string;
  hospital_name: string;
  profession: string;
  specialty: string;
  staff_needed: number;
  department: string;
  reason: string;
  duration_days: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  status: StaffingRequestStatus;
  created_by: string;
  created_at: any;
  updated_at: any;
}

export interface StaffNomination {
  id: string;
  staffing_request_id: string;
  employee_id: string;
  employee_name: string;
  staff_id: string;
  phone_number?: string;
  email?: string;
  position?: string;
  source_hospital_id: string;
  source_hospital_name: string;
  nominated_by: string;
  nominated_by_name: string;
  status: NominationStatus;
  created_at: any;
  updated_at: any;
}

export interface LocumAssignment {
  id: string;
  locum_request_id?: string;
  staffing_request_id?: string;
  employee_id: string;
  employee_name: string;
  staff_id: string;
  source_hospital_id: string;
  source_hospital_name: string;
  destination_hospital_id: string;
  destination_hospital_name: string;
  department: string;
  position: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: LocumAssignmentStatus;
  created_by: string;
  created_at: any;
  completed_at?: any;
}

export interface LocumApproval {
  id: string;
  locum_request_id?: string;
  staffing_request_id?: string;
  step: string;
  approver_id: string;
  approver_name: string;
  action: 'approved' | 'rejected';
  comment?: string;
  created_at: any;
}

export interface LocumHistory {
  id: string;
  locum_request_id: string;
  employee_id: string;
  employee_name: string;
  staff_id: string;
  source_hospital_id: string;
  source_hospital_name: string;
  destination_hospital_id: string;
  destination_hospital_name: string;
  department: string;
  position: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  completed_at: any;
}
