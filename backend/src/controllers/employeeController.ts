import { Response } from 'express';
import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, countDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { firestore } from '../config/firebase';

const enrichEmployee = async (e: any): Promise<any> => {
  let department_name = 'Unknown';
  let hospital_name = 'Unknown';
  if (e.department_id) {
    const dept = await getDoc('departments', e.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  if (e.hospital_id) {
    const hosp = await getDoc('hospitals', e.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...e, department_name, hospital_name };
};

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const hospital_id = req.query.hospital_id as string;
    const department_id = req.query.department_id as string;
    const status = req.query.status as string;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (req.user?.role === 'hospital_admin' && req.user.hospitalId) {
      filters.push({ field: 'hospital_id', op: '==', value: req.user.hospitalId });
    }
    if (hospital_id) filters.push({ field: 'hospital_id', op: '==', value: hospital_id });
    if (department_id) filters.push({ field: 'department_id', op: '==', value: department_id });
    if (status) filters.push({ field: 'status', op: '==', value: status });

    let employees: any[];
    let total: number;

    if (search) {
      const searchLower = search.toLowerCase();
      const { data } = await getDocs('employees', filters, { field: 'created_at', dir: 'desc' }, limit, offset);
      const filtered = data.filter((e: any) =>
        e.full_name?.toLowerCase().includes(searchLower) ||
        e.staff_id?.toLowerCase().includes(searchLower) ||
        e.email?.toLowerCase().includes(searchLower)
      );
      employees = filtered;
      total = filtered.length;
    } else {
      const result = await getDocs('employees', filters, { field: 'created_at', dir: 'desc' }, limit, offset);
      employees = result.data;
      total = result.total;
    }

    const enriched = await Promise.all(employees.map(enrichEmployee));

    res.json({
      employees: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await getDoc('employees', req.params.id);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }
    const enriched = await enrichEmployee(employee);
    res.json(enriched);
  } catch (error: any) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staff_id, full_name, gender, phone_number, email, position, department_id, hospital_id, employment_date } = req.body;

    if (!staff_id || !full_name || !position || !department_id || !hospital_id || !employment_date) {
      res.status(400).json({ error: 'Staff ID, full name, position, department, hospital, and employment date are required.' });
      return;
    }

    const existing = await firestore.collection('employees').where('staff_id', '==', staff_id).limit(1).get();
    if (!existing.empty) {
      res.status(409).json({ error: 'An employee with this staff ID already exists.' });
      return;
    }

    const deptCheck = await getDoc('departments', department_id);
    if (!deptCheck) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const docId = await addDoc('employees', {
      staff_id,
      full_name,
      gender: gender || null,
      phone_number: phone_number || null,
      email: email || null,
      position,
      department_id,
      hospital_id,
      employment_date,
      status: 'active',
    });

    const result = await getDoc('employees', docId);
    await logAudit(req, 'CREATE_EMPLOYEE', 'employee', docId, `Created employee ${full_name} (${staff_id})`);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const empId = req.params.id;
    const { staff_id, full_name, gender, phone_number, email, position, department_id, hospital_id, employment_date, status } = req.body;

    const existing = await getDoc('employees', empId);
    if (!existing) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    if (staff_id && staff_id !== existing.staff_id) {
      const staffCheck = await firestore.collection('employees').where('staff_id', '==', staff_id).limit(1).get();
      if (!staffCheck.empty && staffCheck.docs[0].id !== empId) {
        res.status(409).json({ error: 'An employee with this staff ID already exists.' });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (staff_id !== undefined) updateData.staff_id = staff_id;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (gender !== undefined) updateData.gender = gender;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (email !== undefined) updateData.email = email;
    if (position !== undefined) updateData.position = position;
    if (department_id !== undefined) updateData.department_id = department_id;
    if (hospital_id !== undefined) updateData.hospital_id = hospital_id;
    if (employment_date !== undefined) updateData.employment_date = employment_date;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    await updateDoc('employees', empId, updateData);

    const result = await getDoc('employees', empId);
    const enriched = await enrichEmployee(result);

    await logAudit(req, 'UPDATE_EMPLOYEE', 'employee', empId, `Updated employee ${result.full_name}`);

    res.json(enriched);
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const transferEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const empId = req.params.id;
    const { to_hospital_id, to_department_id, transfer_date, reason } = req.body;

    if (!to_hospital_id || !to_department_id || !transfer_date) {
      res.status(400).json({ error: 'New hospital, new department, and transfer date are required.' });
      return;
    }

    const employee = await getDoc('employees', empId);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    await addDoc('employeeTransfers', {
      employee_id: empId,
      from_hospital_id: employee.hospital_id,
      to_hospital_id,
      from_department_id: employee.department_id,
      to_department_id,
      transfer_date,
      reason: reason || null,
      status: 'pending',
      approved_by: null,
      approved_at: null,
      created_by: req.user!.userId,
    });

    await logAudit(req, 'TRANSFER_EMPLOYEE', 'employee', empId,
      `Transfer requested for employee ${employee.full_name} from ${employee.hospital_id} to ${to_hospital_id} (pending approval)`);

    res.json({ message: 'Transfer request submitted and pending approval.' });
  } catch (error: any) {
    console.error('Transfer employee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const approveTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transferId = req.params.id;
    const transfer = await getDoc('employeeTransfers', transferId);
    if (!transfer) {
      res.status(404).json({ error: 'Transfer not found.' });
      return;
    }

    if (transfer.status !== 'pending') {
      res.status(409).json({ error: `Transfer already ${transfer.status}.` });
      return;
    }

    await updateDoc('employeeTransfers', transferId, {
      status: 'approved',
      approved_by: req.user!.userId,
      approved_at: new Date().toISOString(),
    });

    await updateDoc('employees', transfer.employee_id, {
      hospital_id: transfer.to_hospital_id,
      department_id: transfer.to_department_id,
    });

    const emp = await getDoc('employees', transfer.employee_id);
    await logAudit(req, 'APPROVE_TRANSFER', 'employee_transfer', transferId,
      `Approved transfer of ${emp?.full_name || 'employee'}`);

    res.json({ message: 'Transfer approved successfully.' });
  } catch (error: any) {
    console.error('Approve transfer error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const rejectTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transferId = req.params.id;
    const transfer = await getDoc('employeeTransfers', transferId);
    if (!transfer) {
      res.status(404).json({ error: 'Transfer not found.' });
      return;
    }

    if (transfer.status !== 'pending') {
      res.status(409).json({ error: `Transfer already ${transfer.status}.` });
      return;
    }

    await updateDoc('employeeTransfers', transferId, {
      status: 'rejected',
      approved_by: req.user!.userId,
      approved_at: new Date().toISOString(),
    });

    const emp = await getDoc('employees', transfer.employee_id);
    await logAudit(req, 'REJECT_TRANSFER', 'employee_transfer', transferId,
      `Rejected transfer of ${emp?.full_name || 'employee'}`);

    res.json({ message: 'Transfer rejected.' });
  } catch (error: any) {
    console.error('Reject transfer error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEmployeeTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (status) filters.push({ field: 'status', op: '==', value: status });

    let { data, total } = await getDocs('employeeTransfers', filters, { field: 'created_at', dir: 'desc' }, limit, offset);

    let transfers = [...data];

    if (hospitalId) {
      transfers = transfers.filter((t: any) =>
        t.from_hospital_id === hospitalId || t.to_hospital_id === hospitalId
      );
      total = transfers.length;
    }

    if (search) {
      const searchLower = search.toLowerCase();
      transfers = transfers.filter((t: any) => {
        const empName = t.employee_name?.toLowerCase() || '';
        const staffId = t.staff_id?.toLowerCase() || '';
        return empName.includes(searchLower) || staffId.includes(searchLower);
      });
      total = transfers.length;
    }

    const enriched = await Promise.all(transfers.map(async (t: any) => {
      const [emp, fromHosp, toHosp, fromDept, toDept, creator, approver] = await Promise.all([
        getDoc('employees', t.employee_id),
        getDoc('hospitals', t.from_hospital_id),
        getDoc('hospitals', t.to_hospital_id),
        getDoc('departments', t.from_department_id),
        getDoc('departments', t.to_department_id),
        getDoc('users', t.created_by),
        t.approved_by ? getDoc('users', t.approved_by) : null,
      ]);

      return {
        ...t,
        employee_name: emp?.full_name || 'Unknown',
        staff_id: emp?.staff_id || '',
        from_hospital: fromHosp?.hospital_name || 'Unknown',
        to_hospital: toHosp?.hospital_name || 'Unknown',
        from_department: fromDept?.department_name || 'Unknown',
        to_department: toDept?.department_name || 'Unknown',
        created_by_name: creator?.full_name || 'Unknown',
        approved_by_name: approver?.full_name || null,
      };
    }));

    res.json({
      transfers: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
