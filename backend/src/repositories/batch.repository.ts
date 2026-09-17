import { Pool } from 'pg';
import { ProductionBatch, ChemicalApplication } from '../models/types';

export class BatchRepository {
  constructor(private db: Pool) {}

  public async findAllByTenant(tenantId: string): Promise<any[]> {
    const query = `
      SELECT 
        b.id,
        b.tenant_id,
        b.plot_id,
        b.batch_code,
        b.qr_payload,
        b.status,
        b.planting_date,
        b.estimated_harvest_date,
        b.actual_harvest_date,
        b.created_at,
        p.name AS plot_name,
        p.crop_type,
        p.area_hectares
      FROM production_batches b
      INNER JOIN plots p ON b.plot_id = p.id
      WHERE b.tenant_id = $1
      ORDER BY b.created_at DESC;
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  public async findById(id: string, tenantId: string): Promise<ProductionBatch | null> {
    const query = `
      SELECT id, tenant_id, plot_id, batch_code, qr_payload, status, planting_date, estimated_harvest_date, actual_harvest_date, created_at
      FROM production_batches
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1;
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows.length ? (result.rows[0] as ProductionBatch) : null;
  }

  public async findByQRPayload(qrPayload: string, tenantId?: string): Promise<any | null> {
    let query = `
      SELECT 
        b.id AS batch_id,
        b.batch_code,
        b.qr_payload,
        b.status,
        b.planting_date,
        b.estimated_harvest_date,
        b.actual_harvest_date,
        b.created_at,
        p.id AS plot_id,
        p.name AS plot_name,
        p.crop_type,
        p.area_hectares,
        p.irrigation_system,
        ST_AsGeoJSON(p.boundary) AS boundary_geojson,
        COALESCE(
          (
            SELECT json_agg(c ORDER BY c.application_date DESC)
            FROM chemical_applications c
            WHERE c.batch_id = b.id
          ), '[]'::json
        ) AS chemicals,
        COALESCE(
          (
            SELECT json_agg(e ORDER BY e.created_at DESC)
            FROM (
              SELECT id, batch_id, device_id, event_type, soil_moisture, temperature, valve_status, notes, evidence_hash, created_at
              FROM productive_events
              WHERE batch_id = b.id
              ORDER BY created_at DESC
              LIMIT 50
            ) e
          ), '[]'::json
        ) AS events,
        COALESCE(
          (
            SELECT json_agg(a ORDER BY a.created_at DESC)
            FROM quality_audits a
            WHERE a.batch_id = b.id
          ), '[]'::json
        ) AS audits
      FROM production_batches b
      INNER JOIN plots p ON b.plot_id = p.id
      WHERE b.qr_payload = $1
    `;

    const params: any[] = [qrPayload];
    if (tenantId) {
      query += ` AND b.tenant_id = $2`;
      params.push(tenantId);
    }
    query += ` GROUP BY b.id, p.id LIMIT 1;`;

    const result = await this.db.query(query, params);
    return result.rows.length ? result.rows[0] : null;
  }

  public async getLatestChemicalApplication(batchId: string): Promise<ChemicalApplication | null> {
    const query = `
      SELECT id, batch_id, product_name, active_ingredient, dosage, application_date, withholding_period_days, safe_harvest_date, applied_by, created_at
      FROM chemical_applications
      WHERE batch_id = $1
      ORDER BY safe_harvest_date DESC
      LIMIT 1;
    `;
    const result = await this.db.query(query, [batchId]);
    return result.rows.length ? (result.rows[0] as ChemicalApplication) : null;
  }

  public async updateStatus(batchId: string, status: string, harvestDate?: Date): Promise<void> {
    if (harvestDate) {
      const query = `
        UPDATE production_batches
        SET status = $1, actual_harvest_date = $2
        WHERE id = $3;
      `;
      await this.db.query(query, [status, harvestDate, batchId]);
    } else {
      const query = `
        UPDATE production_batches
        SET status = $1
        WHERE id = $2;
      `;
      await this.db.query(query, [status, batchId]);
    }
  }

  public async addChemicalApplication(app: Omit<ChemicalApplication, 'id' | 'created_at'>): Promise<ChemicalApplication> {
    const query = `
      INSERT INTO chemical_applications (batch_id, product_name, active_ingredient, dosage, application_date, withholding_period_days, safe_harvest_date, applied_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, batch_id, product_name, active_ingredient, dosage, application_date, withholding_period_days, safe_harvest_date, applied_by, created_at;
    `;
    const values = [
      app.batch_id,
      app.product_name,
      app.active_ingredient,
      app.dosage,
      app.application_date,
      app.withholding_period_days,
      app.safe_harvest_date,
      app.applied_by || 'Operador Responsable'
    ];
    const result = await this.db.query(query, values);
    return result.rows[0] as ChemicalApplication;
  }
}
