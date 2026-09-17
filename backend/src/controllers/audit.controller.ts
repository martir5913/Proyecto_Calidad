import { Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuditController {
  constructor(private auditService: AuditService) {}

  public getAudits = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
      const audits = await this.auditService.getAuditsByTenant(tenantId);
      res.status(200).json({
        success: true,
        data: audits,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };

  public createAudit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batch_id, standard_name, compliance_score, observations } = req.body;
      const inspectorId = req.user?.userId || '22222222-2222-2222-2222-222222222222';

      if (!batch_id || !standard_name || compliance_score === undefined) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Campos requeridos: batch_id, standard_name, compliance_score.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const audit = await this.auditService.evaluateAudit({
        batch_id,
        inspector_id: inspectorId,
        standard_name,
        compliance_score: parseFloat(compliance_score),
        observations
      });

      res.status(201).json({
        success: true,
        data: audit,
        message: `Auditoría registrada exitosamente con estado: ${audit.is_compliant ? 'CONFORME' : 'NO CONFORME'}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };
}
