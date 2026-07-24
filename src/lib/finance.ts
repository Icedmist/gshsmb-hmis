import {
  Budget, BudgetItem, FinancialReport, RevenueRecord, ExpenditureRecord,
  PayrollReport, PayrollHistory, TreasuryRecord, Asset, AssetCategory,
  AssetAssignment, AssetMaintenance, ComplianceReport, FinancialAnalytic,
  FinancialDocument, FinancialReview,
} from '../types';
import { getDocById, getDocsPaginated, getDocsAll, addDocument, updateDocument, deleteDocument, countDocs, type FilterConstraint, type PaginationResult } from './firestore';

export const getBudgets = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<Budget>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('budgets', filters, { field: 'budget_year', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((b: any) =>
      b.budget_year?.toString().includes(q) || b.category?.toLowerCase().includes(q)
    );
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('budgets', filters, { field: 'budget_year', dir: 'desc' }, limit, page);
};

export const getBudget = async (id: string) => getDocById('budgets', id);
export const getAllBudgets = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('budgets', filters, { field: 'budget_year', dir: 'desc' });
};

export const createBudget = async (data: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('budgets', data);

export const updateBudget = async (id: string, data: Partial<Budget>) =>
  updateDocument('budgets', id, data);

export const deleteBudget = async (id: string) => deleteDocument('budgets', id);

export const getBudgetItems = async (budgetId: string) => {
  const filters: FilterConstraint[] = [{ field: 'budget_id', op: '==', value: budgetId }];
  return getDocsAll('budget_items', filters);
};

export const createBudgetItem = async (data: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('budget_items', data);

export const updateBudgetItem = async (id: string, data: Partial<BudgetItem>) =>
  updateDocument('budget_items', id, data);

export const deleteBudgetItem = async (id: string) => deleteDocument('budget_items', id);

export const getFinancialReports = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<FinancialReport>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('financial_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.title?.toLowerCase().includes(q) || r.type?.includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('financial_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
};

export const getFinancialReport = async (id: string) => getDocById('financial_reports', id);
export const getAllFinancialReports = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('financial_reports', filters, { field: 'period', dir: 'desc' });
};

export const createFinancialReport = async (data: Omit<FinancialReport, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('financial_reports', data);

export const updateFinancialReport = async (id: string, data: Partial<FinancialReport>) =>
  updateDocument('financial_reports', id, data);

export const deleteFinancialReport = async (id: string) => deleteDocument('financial_reports', id);

export const getRevenueRecords = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<RevenueRecord>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('revenue_records', filters, { field: 'revenue_date', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.source?.toLowerCase().includes(q) || r.reference_number?.toLowerCase().includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('revenue_records', filters, { field: 'revenue_date', dir: 'desc' }, limit, page);
};

export const getRevenueRecord = async (id: string) => getDocById('revenue_records', id);
export const getAllRevenueRecords = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('revenue_records', filters, { field: 'revenue_date', dir: 'desc' });
};

export const createRevenueRecord = async (data: Omit<RevenueRecord, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('revenue_records', data);

export const updateRevenueRecord = async (id: string, data: Partial<RevenueRecord>) =>
  updateDocument('revenue_records', id, data);

export const deleteRevenueRecord = async (id: string) => deleteDocument('revenue_records', id);

export const getExpenditureRecords = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<ExpenditureRecord>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('expenditure_records', filters, { field: 'expenditure_date', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.category?.toLowerCase().includes(q) || r.payee?.toLowerCase().includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('expenditure_records', filters, { field: 'expenditure_date', dir: 'desc' }, limit, page);
};

export const getExpenditureRecord = async (id: string) => getDocById('expenditure_records', id);
export const getAllExpenditureRecords = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('expenditure_records', filters, { field: 'expenditure_date', dir: 'desc' });
};

export const createExpenditureRecord = async (data: Omit<ExpenditureRecord, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('expenditure_records', data);

export const updateExpenditureRecord = async (id: string, data: Partial<ExpenditureRecord>) =>
  updateDocument('expenditure_records', id, data);

export const deleteExpenditureRecord = async (id: string) => deleteDocument('expenditure_records', id);

export const getPayrollReports = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<PayrollReport>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('payroll_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.period?.toLowerCase().includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('payroll_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
};

export const getPayrollReport = async (id: string) => getDocById('payroll_reports', id);
export const getAllPayrollReports = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('payroll_reports', filters, { field: 'period', dir: 'desc' });
};

export const createPayrollReport = async (data: Omit<PayrollReport, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('payroll_reports', data);

export const updatePayrollReport = async (id: string, data: Partial<PayrollReport>) =>
  updateDocument('payroll_reports', id, data);

export const deletePayrollReport = async (id: string) => deleteDocument('payroll_reports', id);

export const getPayrollHistory = async (payrollId: string) => {
  const filters: FilterConstraint[] = [{ field: 'payroll_id', op: '==', value: payrollId }];
  return getDocsAll('payroll_history', filters);
};

export const getTreasuryRecords = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<TreasuryRecord>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('treasury_records', filters, { field: 'transaction_date', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.source?.toLowerCase().includes(q) || r.reference_number?.toLowerCase().includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('treasury_records', filters, { field: 'transaction_date', dir: 'desc' }, limit, page);
};

export const getTreasuryRecord = async (id: string) => getDocById('treasury_records', id);
export const getAllTreasuryRecords = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('treasury_records', filters, { field: 'transaction_date', dir: 'desc' });
};

export const createTreasuryRecord = async (data: Omit<TreasuryRecord, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('treasury_records', data);

export const updateTreasuryRecord = async (id: string, data: Partial<TreasuryRecord>) =>
  updateDocument('treasury_records', id, data);

export const deleteTreasuryRecord = async (id: string) => deleteDocument('treasury_records', id);

export const getAssets = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<Asset>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('assets', filters, { field: 'asset_name', dir: 'asc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((a: any) => a.asset_name?.toLowerCase().includes(q) || a.serial_number?.toLowerCase().includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('assets', filters, { field: 'asset_name', dir: 'asc' }, limit, page);
};

export const getAsset = async (id: string) => getDocById('assets', id);
export const getAllAssets = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('assets', filters, { field: 'asset_name', dir: 'asc' });
};

export const createAsset = async (data: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('assets', data);

export const updateAsset = async (id: string, data: Partial<Asset>) =>
  updateDocument('assets', id, data);

export const deleteAsset = async (id: string) => deleteDocument('assets', id);

export const getAssetCategories = async () =>
  getDocsAll('asset_categories', [], { field: 'name', dir: 'asc' });

export const createAssetCategory = async (data: Omit<AssetCategory, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('asset_categories', data);

export const getAssetAssignments = async (assetId: string) => {
  const filters: FilterConstraint[] = [{ field: 'asset_id', op: '==', value: assetId }];
  return getDocsAll('asset_assignments', filters, { field: 'assignment_date', dir: 'desc' });
};

export const createAssetAssignment = async (data: Omit<AssetAssignment, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('asset_assignments', data);

export const getAssetMaintenance = async (page = 1, limit = 50, hospitalScope?: string): Promise<PaginationResult<AssetMaintenance>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsPaginated('asset_maintenance', filters, { field: 'maintenance_date', dir: 'desc' }, limit, page);
};

export const createAssetMaintenance = async (data: Omit<AssetMaintenance, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('asset_maintenance', data);

export const getComplianceReports = async (page = 1, limit = 50, search?: string, hospitalScope?: string): Promise<PaginationResult<ComplianceReport>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (search) {
    const { data } = await getDocsPaginated('compliance_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
    const q = search.toLowerCase();
    const filtered = data.filter((r: any) => r.title?.toLowerCase().includes(q) || r.report_type?.includes(q));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('compliance_reports', filters, { field: 'period', dir: 'desc' }, limit, page);
};

export const getComplianceReport = async (id: string) => getDocById('compliance_reports', id);

export const createComplianceReport = async (data: Omit<ComplianceReport, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('compliance_reports', data);

export const updateComplianceReport = async (id: string, data: Partial<ComplianceReport>) =>
  updateDocument('compliance_reports', id, data);

export const deleteComplianceReport = async (id: string) => deleteDocument('compliance_reports', id);

export const getFinancialAnalytics = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('financial_analytics', filters, { field: 'period', dir: 'desc' });
};

export const createFinancialAnalytic = async (data: Omit<FinancialAnalytic, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('financial_analytics', data);

export const getFinanceDashboardStats = async (hospitalScope?: string) => {
  const bf: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
  const [budgets, reports, revenue, expenditure, payroll, assets, compliance] = await Promise.all([
    getDocsAll('budgets', bf),
    getDocsAll('financial_reports', bf),
    getDocsAll('revenue_records', bf),
    getDocsAll('expenditure_records', bf),
    getDocsAll('payroll_reports', bf),
    getDocsAll('assets', bf),
    getDocsAll('compliance_reports', bf),
  ]);
  const totalBudget = budgets.reduce((s, b: any) => s + (b.approved_amount || 0), 0);
  const totalActualBudget = budgets.reduce((s, b: any) => s + (b.actual_amount || 0), 0);
  const totalRevenue = revenue.reduce((s, r: any) => s + (r.amount || 0), 0);
  const totalExpenditure = expenditure.reduce((s, e: any) => s + (e.amount || 0), 0);
  const totalPayroll = payroll.reduce((s, p: any) => s + (p.net_pay || 0), 0);
  const totalAssetValue = assets.reduce((s, a: any) => s + (a.current_value || 0), 0);
  const openCompliance = compliance.filter((c: any) => c.status === 'open' || c.status === 'in_progress').length;
  return {
    totalBudgets: budgets.length,
    totalBudget,
    totalActualBudget,
    budgetUtilization: totalBudget > 0 ? Math.round((totalActualBudget / totalBudget) * 100) : 0,
    totalReports: reports.length,
    totalRevenue,
    totalRevenueCount: revenue.length,
    totalExpenditure,
    totalExpenditureCount: expenditure.length,
    netPosition: totalRevenue - totalExpenditure,
    totalPayroll,
    totalPayrollCount: payroll.length,
    totalAssets: assets.length,
    totalAssetValue,
    totalCompliance: compliance.length,
    openCompliance,
  };
};

export const getFinancialDocuments = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('financial_documents', filters, { field: 'created_at', dir: 'desc' });
};

export const createFinancialDocument = async (data: Omit<FinancialDocument, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('financial_documents', data);

export const deleteFinancialDocument = async (id: string) => deleteDocument('financial_documents', id);

export const getFinancialReviews = async (hospitalScope?: string) => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('financial_reviews', filters, { field: 'created_at', dir: 'desc' });
};

export const createFinancialReview = async (data: Omit<FinancialReview, 'id' | 'created_at' | 'updated_at'>) =>
  addDocument('financial_reviews', data);

export const respondToFinancialReview = async (id: string, response: string) =>
  updateDocument('financial_reviews', id, { response, status: 'responded', responded_at: new Date() });
