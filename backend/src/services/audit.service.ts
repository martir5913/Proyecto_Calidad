import { AuditRepository } from '../repositories/audit.repository';
import { QualityAudit } from '../models/types';

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  public async evaluateAudit(data: {
    batch_id: string;
    inspector_id: string;
    standard_name: 'GLOBALGAP' | 'USDA_ORGANIC';
    compliance_score: number;
    observations?: string;
  }): Promise<QualityAudit> {
    // Criterio normativo: score >= 90% es conforme
    const isCompliant = data.compliance_score >= 90.0;

    return await this.auditRepo.create({
      batch_id: data.batch_id,
      inspector_id: data.inspector_id,
      standard_name: data.standard_name,
      compliance_score: data.compliance_score,
      is_compliant: isCompliant,
      observations: data.observations || `Auditoría ${data.standard_name} finalizada con resultado: ${isCompliant ? 'CONFORME (APROBADO)' : 'NO CONFORME (ACCIÓN CORRECTIVA REQUERIDA)'}`
    });
  }

  public async getAuditsByTenant(tenantId: string) {
    return await this.auditRepo.findAllByTenant(tenantId);
  }
}
