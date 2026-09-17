import { Pool } from 'pg';
import { ProductiveEvent } from '../models/types';

export class TelemetryRepository {
  constructor(private db: Pool) {}

  public async insertEvent(event: ProductiveEvent): Promise<ProductiveEvent> {
    const query = `
      INSERT INTO productive_events (batch_id, device_id, event_type, soil_moisture, temperature, valve_status, notes, evidence_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, batch_id, device_id, event_type, soil_moisture, temperature, valve_status, notes, evidence_hash, created_at;
    `;
    const values = [
      event.batch_id,
      event.device_id || 'ESP32_SECTOR_01',
      event.event_type,
      event.soil_moisture !== undefined ? event.soil_moisture : null,
      event.temperature !== undefined ? event.temperature : null,
      event.valve_status || 'OFF',
      event.notes || '',
      event.evidence_hash || null
    ];
    const result = await this.db.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      soil_moisture: row.soil_moisture !== null ? parseFloat(row.soil_moisture) : undefined,
      temperature: row.temperature !== null ? parseFloat(row.temperature) : undefined
    };
  }

  public async getRecentEvents(batchId?: string, limit: number = 30): Promise<ProductiveEvent[]> {
    let query = `
      SELECT e.id, e.batch_id, e.device_id, e.event_type, e.soil_moisture, e.temperature, e.valve_status, e.notes, e.evidence_hash, e.created_at, b.batch_code
      FROM productive_events e
      INNER JOIN production_batches b ON e.batch_id = b.id
    `;
    const params: any[] = [];
    if (batchId) {
      query += ` WHERE e.batch_id = $1`;
      params.push(batchId);
    }
    query += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows.map(row => ({
      ...row,
      soil_moisture: row.soil_moisture !== null ? parseFloat(row.soil_moisture) : undefined,
      temperature: row.temperature !== null ? parseFloat(row.temperature) : undefined
    }));
  }

  public async getLatestTelemetry(batchId: string): Promise<ProductiveEvent | null> {
    const query = `
      SELECT id, batch_id, device_id, event_type, soil_moisture, temperature, valve_status, notes, evidence_hash, created_at
      FROM productive_events
      WHERE batch_id = $1 AND event_type IN ('TELEMETRIA_IOT', 'RIEGO')
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await this.db.query(query, [batchId]);
    if (!result.rows.length) return null;
    const row = result.rows[0];
    return {
      ...row,
      soil_moisture: row.soil_moisture !== null ? parseFloat(row.soil_moisture) : undefined,
      temperature: row.temperature !== null ? parseFloat(row.temperature) : undefined
    };
  }
}
