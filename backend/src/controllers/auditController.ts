import { Response } from 'express';
import { getDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action as string;
    const userId = req.query.user_id as string;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (action) filters.push({ field: 'action', op: '==', value: action });
    if (userId) filters.push({ field: 'user_id', op: '==', value: userId });

    const { data, total } = await getDocs('auditLogs', filters, { field: 'created_at', dir: 'desc' }, limit, offset);

    const enriched = await Promise.all(data.map(async (log: any) => {
      let user_name = 'Unknown';
      if (log.user_id) {
        const { getDoc } = await import('../config/database');
        const user = await getDoc('users', log.user_id);
        if (user) user_name = user.full_name;
      }
      return { ...log, user_name };
    }));

    res.json({
      logs: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
