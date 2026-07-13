import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
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
import MedicalDashboardPage from './pages/MedicalDashboardPage';
import NursingDashboardPage from './pages/NursingDashboardPage';
import PRSDashboardPage from './pages/PRSDashboardPage';
import PerformanceIndicatorsPage from './pages/PerformanceIndicatorsPage';
import PharmaceuticalDashboardPage from './pages/PharmaceuticalDashboardPage';
import MedicineRegistryPage from './pages/MedicineRegistryPage';
import EssentialMedicinesPage from './pages/EssentialMedicinesPage';
import PharmaceuticalAuditsPage from './pages/PharmaceuticalAuditsPage';
import PharmaceuticalWorkforcePage from './pages/PharmaceuticalWorkforcePage';
import PharmaceuticalQualityPage from './pages/PharmaceuticalQualityPage';
import PharmacovigilancePage from './pages/PharmacovigilancePage';
import PharmaceuticalReportsPage from './pages/PharmaceuticalReportsPage';
import LaboratoryDashboardPage from './pages/LaboratoryDashboardPage';
import LaboratoryRegistryPage from './pages/LaboratoryRegistryPage';
import LaboratoryAuditsPage from './pages/LaboratoryAuditsPage';
import LaboratoryWorkforcePage from './pages/LaboratoryWorkforcePage';
import EquipmentRegistryPage from './pages/EquipmentRegistryPage';
import MaintenanceRecordsPage from './pages/MaintenanceRecordsPage';
import ReagentsPage from './pages/ReagentsPage';
import DiseaseSurveillancePage from './pages/DiseaseSurveillancePage';
import LaboratoryReportsPage from './pages/LaboratoryReportsPage';

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
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/clinical-guidelines" element={<ClinicalGuidelinesPage />} />
            <Route path="/clinical-audits" element={<ClinicalAuditsPage />} />
            <Route path="/specialists" element={<SpecialistsPage />} />
            <Route path="/referral-oversight" element={<ReferralOversightPage />} />
            <Route path="/nursing-workforce" element={<NursingWorkforcePage />} />
            <Route path="/nursing-audits" element={<NursingAuditsPage />} />
            <Route path="/nursing-training" element={<NursingTrainingPage />} />
            <Route path="/kpis" element={<KPIPage />} />
            <Route path="/scorecards" element={<ScorecardsPage />} />
            <Route path="/performance-indicators" element={<PerformanceIndicatorsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/research" element={<ResearchProjectsPage />} />
            <Route path="/medical-dashboard" element={<MedicalDashboardPage />} />
            <Route path="/nursing-dashboard" element={<NursingDashboardPage />} />
            <Route path="/prs-dashboard" element={<PRSDashboardPage />} />
            <Route path="/pharmaceutical-dashboard" element={<PharmaceuticalDashboardPage />} />
            <Route path="/medicine-registry" element={<MedicineRegistryPage />} />
            <Route path="/essential-medicines" element={<EssentialMedicinesPage />} />
            <Route path="/pharmaceutical-audits" element={<PharmaceuticalAuditsPage />} />
            <Route path="/pharmaceutical-workforce" element={<PharmaceuticalWorkforcePage />} />
            <Route path="/pharmaceutical-quality" element={<PharmaceuticalQualityPage />} />
            <Route path="/pharmacovigilance" element={<PharmacovigilancePage />} />
            <Route path="/pharmaceutical-reports" element={<PharmaceuticalReportsPage />} />
            <Route path="/laboratory-dashboard" element={<LaboratoryDashboardPage />} />
            <Route path="/laboratory-registry" element={<LaboratoryRegistryPage />} />
            <Route path="/laboratory-audits" element={<LaboratoryAuditsPage />} />
            <Route path="/laboratory-workforce" element={<LaboratoryWorkforcePage />} />
            <Route path="/equipment-registry" element={<EquipmentRegistryPage />} />
            <Route path="/maintenance-records" element={<MaintenanceRecordsPage />} />
            <Route path="/reagents" element={<ReagentsPage />} />
            <Route path="/disease-surveillance" element={<DiseaseSurveillancePage />} />
            <Route path="/laboratory-reports" element={<LaboratoryReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}