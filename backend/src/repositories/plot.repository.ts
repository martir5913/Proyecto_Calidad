import { Pool } from 'pg';
import { Plot } from '../models/types';

export class PlotRepository {
  constructor(private db: Pool) {}

  public async findAllByTenant(tenantId: string): Promise<Plot[]> {
    const query = `
      SELECT 
        id, 
        tenant_id, 
        code, 
        name, 
        crop_type, 
        area_hectares, 
        irrigation_system,
        ST_AsGeoJSON(boundary) AS boundary_geojson,
        created_at
      FROM plots
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows.map(row => ({
      ...row,
      area_hectares: parseFloat(row.area_hectares)
    }));
  }

  public async findById(id: string, tenantId: string): Promise<Plot | null> {
    const query = `
      SELECT 
        id, 
        tenant_id, 
        code, 
        name, 
        crop_type, 
        area_hectares, 
        irrigation_system,
        ST_AsGeoJSON(boundary) AS boundary_geojson,
        created_at
      FROM plots
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1;
    `;
    const result = await this.db.query(query, [id, tenantId]);
    if (!result.rows.length) return null;
    const row = result.rows[0];
    return {
      ...row,
      area_hectares: parseFloat(row.area_hectares)
    };
  }

  public async create(plot: Omit<Plot, 'id' | 'created_at'>, wktPolygon: string): Promise<Plot> {
    const query = `
      INSERT INTO plots (tenant_id, code, name, crop_type, area_hectares, boundary, irrigation_system)
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7)
      RETURNING id, tenant_id, code, name, crop_type, area_hectares, ST_AsGeoJSON(boundary) as boundary_geojson, irrigation_system, created_at;
    `;
    const values = [
      plot.tenant_id,
      plot.code,
      plot.name,
      plot.crop_type,
      plot.area_hectares,
      wktPolygon,
      plot.irrigation_system || 'GOTEO_AUTOMATIZADO'
    ];
    const result = await this.db.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      area_hectares: parseFloat(row.area_hectares)
    };
  }
}
