import { PlotRepository } from '../repositories/plot.repository';
import { Plot } from '../models/types';

export class PlotService {
  constructor(private plotRepo: PlotRepository) {}

  public async getPlots(tenantId: string): Promise<Plot[]> {
    return await this.plotRepo.findAllByTenant(tenantId);
  }

  public async getPlotById(id: string, tenantId: string): Promise<Plot | null> {
    return await this.plotRepo.findById(id, tenantId);
  }

  public async createPlot(tenantId: string, data: {
    code: string;
    name: string;
    crop_type: string;
    area_hectares: number;
    wkt_polygon: string;
    irrigation_system?: string;
  }): Promise<Plot> {
    if (!data.wkt_polygon || !data.wkt_polygon.startsWith('POLYGON')) {
      throw new Error('Formato espacial inválido: Se requiere un WKT POLYGON válido.');
    }

    return await this.plotRepo.create({
      tenant_id: tenantId,
      code: data.code,
      name: data.name,
      crop_type: data.crop_type,
      area_hectares: data.area_hectares,
      irrigation_system: data.irrigation_system || 'GOTEO_AUTOMATIZADO'
    }, data.wkt_polygon);
  }
}
