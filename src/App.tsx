import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { UserRole } from './types';
import Layout from './components/layout/Layout';

function RequireRole({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role as UserRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import HospitalsPage from './pages/HospitalsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import EmployeesPage from './pages/EmployeesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import TransfersPage from './pages/TransfersPage';
import LocumDashboardPage from './pages/LocumDashboardPage';
import LocumRequestsPage from './pages/LocumRequestsPage';
import LocumAssignmentsPage from './pages/LocumAssignmentsPage';
import ReportsPage from './pages/ReportsPage';
import ClinicalGuidelinesPage from './pages/ClinicalGuidelinesPage';
import ClinicalAuditsPage from './pages/ClinicalAuditsPage';
import SpecialistsPage from './pages/SpecialistsPage';
import ReferralOversightPage from './pages/ReferralOversightPage';
import NursingWorkforcePage from './pages/NursingWorkforcePage';
import NursingAuditsPage from './pages/NursingAuditsPage';
import NursingTrainingPage from './pages/NursingTrainingPage';
import KPIPage from './pages/KPIPage';
import ScorecardsPage from './pages/ScorecardsPage';
import StatisticsPage from './pages/StatisticsPage';
import ResearchProjectsPage from './pages/ResearchProjectsPage';

import PerformanceIndicatorsPage from './pages/PerformanceIndicatorsPage';

import MedicineRegistryPage from './pages/MedicineRegistryPage';
import EssentialMedicinesPage from './pages/EssentialMedicinesPage';
import PharmaceuticalAuditsPage from './pages/PharmaceuticalAuditsPage';
import PharmaceuticalWorkforcePage from './pages/PharmaceuticalWorkforcePage';
import PharmaceuticalQualityPage from './pages/PharmaceuticalQualityPage';
import PharmacovigilancePage from './pages/PharmacovigilancePage';
import PharmaceuticalReportsPage from './pages/PharmaceuticalReportsPage';

import LaboratoryRegistryPage from './pages/LaboratoryRegistryPage';
import LaboratoryAuditsPage from './pages/LaboratoryAuditsPage';
import LaboratoryWorkforcePage from './pages/LaboratoryWorkforcePage';
import EquipmentRegistryPage from './pages/EquipmentRegistryPage';
import MaintenanceRecordsPage from './pages/MaintenanceRecordsPage';
import ReagentsPage from './pages/ReagentsPage';
import DiseaseSurveillancePage from './pages/DiseaseSurveillancePage';
import LaboratoryReportsPage from './pages/LaboratoryReportsPage';
import FinanceDashboardPage from './pages/FinanceDashboardPage';
import BudgetManagementPage from './pages/BudgetManagementPage';
import FinancialReportsPage from './pages/FinancialReportsPage';
import RevenueManagementPage from './pages/RevenueManagementPage';
import ExpenditureManagementPage from './pages/ExpenditureManagementPage';
import PayrollMonitoringPage from './pages/PayrollMonitoringPage';
import TreasuryManagementPage from './pages/TreasuryManagementPage';
import AssetManagementPage from './pages/AssetManagementPage';
import FinancialCompliancePage from './pages/FinancialCompliancePage';
import FinancialAnalyticsPage from './pages/FinancialAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import DocumentsPage from './pages/DocumentsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import MessagesPage from './pages/MessagesPage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import ActivityTimelinePage from './pages/ActivityTimelinePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/locum-dashboard" element={<LocumDashboardPage />} />
            <Route path="/locum-requests" element={<LocumRequestsPage />} />
            <Route path="/locum-assignments" element={<LocumAssignmentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/clinical-guidelines" element={<ClinicalGuidelinesPage />} />
            <Route path="/clinical-audits" element={<ClinicalAuditsPage />} />
            <Route path="/specialists" element={<SpecialistsPage />} />
            <Route path="/referral-oversight" element={<ReferralOversightPage />} />
            <Route path="/referral-reports" element={<ReferralOversightPage />} />
            <Route path="/emergency-reports" element={<ReferralOversightPage />} />
            <Route path="/nursing-workforce" element={<NursingWorkforcePage />} />
            <Route path="/nursing-audits" element={<NursingAuditsPage />} />
            <Route path="/nursing-training" element={<NursingTrainingPage />} />
            <Route path="/nursing-certifications" element={<NursingTrainingPage />} />
            <Route path="/kpis" element={<KPIPage />} />
            <Route path="/scorecards" element={<ScorecardsPage />} />
            <Route path="/performance-indicators" element={<PerformanceIndicatorsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/research" element={<ResearchProjectsPage />} />

            <Route path="/medicine-registry" element={<MedicineRegistryPage />} />
            <Route path="/essential-medicines" element={<EssentialMedicinesPage />} />
            <Route path="/pharmaceutical-audits" element={<PharmaceuticalAuditsPage />} />
            <Route path="/pharmaceutical-workforce" element={<PharmaceuticalWorkforcePage />} />
            <Route path="/pharmaceutical-quality" element={<PharmaceuticalQualityPage />} />
            <Route path="/pharmacovigilance" element={<PharmacovigilancePage />} />
            <Route path="/pharmaceutical-reports" element={<PharmaceuticalReportsPage />} />

            <Route path="/laboratory-registry" element={<LaboratoryRegistryPage />} />
            <Route path="/laboratory-audits" element={<LaboratoryAuditsPage />} />
            <Route path="/laboratory-workforce" element={<LaboratoryWorkforcePage />} />
            <Route path="/equipment-registry" element={<EquipmentRegistryPage />} />
            <Route path="/maintenance-records" element={<MaintenanceRecordsPage />} />
            <Route path="/reagents" element={<ReagentsPage />} />
            <Route path="/disease-surveillance" element={<DiseaseSurveillancePage />} />
            <Route path="/laboratory-reports" element={<LaboratoryReportsPage />} />
            <Route path="/finance-dashboard" element={<RequireRole roles={['director_finance']}><FinanceDashboardPage /></RequireRole>} />
            <Route path="/budget-management" element={<RequireRole roles={['director_finance']}><BudgetManagementPage /></RequireRole>} />
            <Route path="/financial-reports" element={<RequireRole roles={['director_finance','executive_secretary','hospital_admin']}><FinancialReportsPage /></RequireRole>} />
            <Route path="/revenue-management" element={<RequireRole roles={['director_finance']}><RevenueManagementPage /></RequireRole>} />
            <Route path="/expenditure-management" element={<RequireRole roles={['director_finance']}><ExpenditureManagementPage /></RequireRole>} />
            <Route path="/payroll-monitoring" element={<RequireRole roles={['director_finance','hr_officer','director_hr']}><PayrollMonitoringPage /></RequireRole>} />
            <Route path="/treasury-management" element={<RequireRole roles={['director_finance']}><TreasuryManagementPage /></RequireRole>} />
            <Route path="/asset-management" element={<RequireRole roles={['director_finance']}><AssetManagementPage /></RequireRole>} />
            <Route path="/financial-compliance" element={<RequireRole roles={['director_finance']}><FinancialCompliancePage /></RequireRole>} />
            <Route path="/financial-analytics" element={<RequireRole roles={['director_finance','executive_secretary','director_prs']}><FinancialAnalyticsPage /></RequireRole>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/activity-timeline" element={<ActivityTimelinePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}