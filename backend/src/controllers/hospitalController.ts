import { Response } from 'express';
import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, countDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { firestore } from '../config/firebase';

export const getHospitals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (hospitalId) filters.push({ field: '__name__', op: '==', value: hospitalId });
    if (status) filters.push({ field: 'status', op: '==', value: status });

    if (search) {
      const searchLower = search.toLowerCase();
      const { data } = await getDocs('hospitals', filters, { field: 'hospital_name', dir: 'asc' }, limit, offset);
      const filtered = data.filter((h: any) =>
        h.hospital_name?.toLowerCase().includes(searchLower) ||
        h.hospital_code?.toLowerCase().includes(searchLower) ||
        h.lga?.toLowerCase().includes(searchLower)
      );
      const total = filtered.length;
      res.json({
        hospitals: filtered,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
      return;
    }

    const { data, total } = await getDocs('hospitals', filters, { field: 'hospital_name', dir: 'asc' }, limit, offset);

    res.json({
      hospitals: data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getHospital = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await getDoc('hospitals', req.params.id);
    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found.' });
      return;
    }
    res.json(hospital);
  } catch (error: any) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createHospital = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hospital_name, hospital_code, address, lga, contact_email, contact_phone } = req.body;

    if (!hospital_name || !hospital_code || !address || !lga) {
      res.status(400).json({ error: 'Hospital name, code, address, and LGA are required.' });
      return;
    }

    const existing = await firestore.collection('hospitals').where('hospital_code', '==', hospital_code).limit(1).get();
    if (!existing.empty) {
      res.status(409).json({ error: 'A hospital with this code already exists.' });
      return;
    }

    const docId = await addDoc('hospitals', {
      hospital_name,
      hospital_code,
      address,
      lga,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      status: 'active',
    });

    const result = await getDoc('hospitals', docId);
    await logAudit(req, 'CREATE_HOSPITAL', 'hospital', docId, `Created hospital ${hospital_name}`);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteHospital = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.params.id;

    const existing = await getDoc('hospitals', hospitalId);
    if (!existing) {
      res.status(404).json({ error: 'Hospital not found.' });
      return;
    }

    const [deptCount, empCount] = await Promise.all([
      countDocs('departments', [{ field: 'hospital_id', op: '==', value: hospitalId }]),
      countDocs('employees', [{ field: 'hospital_id', op: '==', value: hospitalId }]),
    ]);

    if (deptCount > 0 || empCount > 0) {
      const details: string[] = [];
      if (deptCount > 0) details.push(`${deptCount} department(s)`);
      if (empCount > 0) details.push(`${empCount} employee(s)`);
      res.status(409).json({ error: `Cannot delete. ${details.join(' and ')} are linked to this hospital.` });
      return;
    }

    await deleteDoc('hospitals', hospitalId);

    await logAudit(req, 'DELETE_HOSPITAL', 'hospital', hospitalId, `Deleted hospital ${existing.hospital_name}`);

    res.json({ message: 'Hospital deleted successfully.' });
  } catch (error: any) {
    console.error('Delete hospital error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateHospital = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.params.id;
    const { hospital_name, hospital_code, address, lga, contact_email, contact_phone, status } = req.body;

    const existing = await getDoc('hospitals', hospitalId);
    if (!existing) {
      res.status(404).json({ error: 'Hospital not found.' });
      return;
    }

    if (hospital_code && hospital_code !== existing.hospital_code) {
      const codeCheck = await firestore.collection('hospitals')
        .where('hospital_code', '==', hospital_code).limit(1).get();
      if (!codeCheck.empty && codeCheck.docs[0].id !== hospitalId) {
        res.status(409).json({ error: 'A hospital with this code already exists.' });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (hospital_name !== undefined) updateData.hospital_name = hospital_name;
    if (hospital_code !== undefined) updateData.hospital_code = hospital_code;
    if (address !== undefined) updateData.address = address;
    if (lga !== undefined) updateData.lga = lga;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    await updateDoc('hospitals', hospitalId, updateData);

    const result = await getDoc('hospitals', hospitalId);
    await logAudit(req, 'UPDATE_HOSPITAL', 'hospital', hospitalId, `Updated hospital ${result.hospital_name}`);

    res.json(result);
  } catch (error: any) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
