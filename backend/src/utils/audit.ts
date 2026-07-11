import { addDoc } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const logAudit = async (
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    await addDoc('auditLogs', {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
    });
  } catch (error: any) {
    console.error('Audit log error:', error?.message || error);
  }
};
