import { Pool } from 'pg';
import { QualityAudit } from '../models/types';

export class AuditRepository {
  constructor(private db: Pool) {}

  public async create(audit: QualityAudit): Promise<QualityAudit> {
    const query = `
      INSERT INTO quality_audits (batch_id, inspector_id, standard_name, compliance_score, is_compliant, observations)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, batch_id, inspector_id, standard_name, compliance_score, is_compliant, observations, created_at;
    `;
    const values = [
      audit.batch_id,
      audit.inspector_id,
      audit.standard_name,
      audit.compliance_score,
      audit.is_compliant,
      audit.observations || ''
    ];
    const result = await this.db.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      compliance_score: parseFloat(row.compliance_score)
    };
  }

  public async findAllByTenant(tenantId: string): Promise<any[]> {
    const query = `
      SELECT 
        a.id,
        a.batch_id,
        a.inspector_id,
        a.standard_name,
        a.compliance_score,
        a.is_compliant,
        a.observations,
        a.created_at,
        b.batch_code,
        u.full_name AS inspector_name
      FROM quality_audits a
      INNER JOIN production_batches b ON a.batch_id = b.id
      INNER JOIN users u ON a.inspector_id = u.id
      WHERE b.tenant_id = $1
      ORDER BY a.created_at DESC;
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows.map(row => ({
      ...row,
      compliance_score: parseFloat(row.compliance_score)
    }));
  }
}
