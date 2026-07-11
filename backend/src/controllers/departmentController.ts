import { Response } from 'express';
import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, countDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { firestore } from '../config/firebase';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const hospital_id = req.query.hospital_id as string;
    const status = req.query.status as string;
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    if (hospital_id) filters.push({ field: 'hospital_id', op: '==', value: hospital_id });
    if (status) filters.push({ field: 'status', op: '==', value: status });

    let departments: any[];
    let total: number;

    if (search) {
      const searchLower = search.toLowerCase();
      const { data } = await getDocs('departments', filters, { field: 'department_name', dir: 'asc' }, limit, offset);
      const filtered = data.filter((d: any) =>
        d.department_name?.toLowerCase().includes(searchLower) ||
        d.department_code?.toLowerCase().includes(searchLower)
      );
      departments = filtered;
      total = filtered.length;
    } else {
      const result = await getDocs('departments', filters, { field: 'department_name', dir: 'asc' }, limit, offset);
      departments = result.data;
      total = result.total;
    }

    const enriched = await Promise.all(departments.map(async (d: any) => {
      if (d.hospital_id) {
        const hospital = await getDoc('hospitals', d.hospital_id);
        return { ...d, hospital_name: hospital?.hospital_name || 'Unknown' };
      }
      return { ...d, hospital_name: 'Unknown' };
    }));

    res.json({
      departments: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dept = await getDoc('departments', req.params.id);
    if (!dept) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }
    let hospital_name = 'Unknown';
    if (dept.hospital_id) {
      const hospital = await getDoc('hospitals', dept.hospital_id);
      hospital_name = hospital?.hospital_name || 'Unknown';
    }
    res.json({ ...dept, hospital_name });
  } catch (error: any) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department_name, department_code, description, hospital_ids } = req.body;

    if (!department_name || !department_code || !hospital_ids || !Array.isArray(hospital_ids) || hospital_ids.length === 0) {
      res.status(400).json({ error: 'Department name, code, and at least one hospital are required.' });
      return;
    }

    const createdDepartments: any[] = [];

    for (const hospitalId of hospital_ids) {
      const hospital = await getDoc('hospitals', hospitalId);
      if (!hospital) continue;

      const fullCode = `${department_code}-${hospital.hospital_code}`;

      const existing = await firestore.collection('departments')
        .where('department_code', '==', fullCode).limit(1).get();
      if (!existing.empty) continue;

      const docId = await addDoc('departments', {
        department_name,
        department_code: fullCode,
        description: description || null,
        hospital_id: hospitalId,
        status: 'active',
      });

      const result = await getDoc('departments', docId);
      createdDepartments.push(result);
    }

    if (createdDepartments.length === 0) {
      res.status(400).json({ error: 'No valid hospitals selected.' });
      return;
    }

    await logAudit(req, 'CREATE_DEPARTMENT', 'department', createdDepartments[0].id,
      `Created department ${department_name} in ${createdDepartments.length} hospital(s)`);

    res.status(201).json({
      message: `Department created in ${createdDepartments.length} hospital(s)`,
      departments: createdDepartments,
    });
  } catch (error: any) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.params.id;

    const existing = await getDoc('departments', deptId);
    if (!existing) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const empCount = await countDocs('employees', [{ field: 'department_id', op: '==', value: deptId }]);
    if (empCount > 0) {
      res.status(409).json({ error: `Cannot delete. ${empCount} employee(s) are assigned to this department.` });
      return;
    }

    await deleteDoc('departments', deptId);

    await logAudit(req, 'DELETE_DEPARTMENT', 'department', deptId, `Deleted department ${existing.department_name}`);

    res.json({ message: 'Department deleted successfully.' });
  } catch (error: any) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.params.id;
    const { department_name, department_code, description, hospital_id, status } = req.body;

    const existing = await getDoc('departments', deptId);
    if (!existing) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    if (department_code && department_code !== existing.department_code) {
      const codeCheck = await firestore.collection('departments')
        .where('department_code', '==', department_code).limit(1).get();
      if (!codeCheck.empty && codeCheck.docs[0].id !== deptId) {
        res.status(409).json({ error: 'A department with this code already exists.' });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (department_name !== undefined) updateData.department_name = department_name;
    if (department_code !== undefined) updateData.department_code = department_code;
    if (description !== undefined) updateData.description = description;
    if (hospital_id !== undefined) updateData.hospital_id = hospital_id;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    await updateDoc('departments', deptId, updateData);

    const result = await getDoc('departments', deptId);

    await logAudit(req, 'UPDATE_DEPARTMENT', 'department', deptId, `Updated department ${result.department_name}`);

    let hospital_name = 'Unknown';
    if (result.hospital_id) {
      const hospital = await getDoc('hospitals', result.hospital_id);
      hospital_name = hospital?.hospital_name || 'Unknown';
    }

    res.json({ ...result, hospital_name });
  } catch (error: any) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getDepartmentNames = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

    const { data } = await getDocs('departments', filters, { field: 'department_name', dir: 'asc' });

    const grouped = new Map<string, any>();
    for (const d of data) {
      const baseCode = d.department_code?.includes('-') ? d.department_code.split('-')[0] : d.department_code;
      if (!grouped.has(d.department_name)) {
        grouped.set(d.department_name, {
          department_name: d.department_name,
          base_code: baseCode,
          description: d.description,
          status: d.status,
        });
      }
    }

    res.json({ departmentNames: Array.from(grouped.values()) });
  } catch (error: any) {
    console.error('Get department names error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
