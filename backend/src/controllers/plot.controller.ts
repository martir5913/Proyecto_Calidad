import { Response, NextFunction } from 'express';
import { PlotService } from '../services/plot.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class PlotController {
  constructor(private plotService: PlotService) {}

  public getPlots = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
      const plots = await this.plotService.getPlots(tenantId);
      res.status(200).json({
        success: true,
        data: plots,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };

  public createPlot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
      const { code, name, crop_type, area_hectares, wkt_polygon, irrigation_system } = req.body;

      if (!code || !name || !crop_type || !area_hectares || !wkt_polygon) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Campos requeridos: code, name, crop_type, area_hectares, wkt_polygon.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const newPlot = await this.plotService.createPlot(tenantId, {
        code,
        name,
        crop_type,
        area_hectares: parseFloat(area_hectares),
        wkt_polygon,
        irrigation_system
      });

      res.status(201).json({
        success: true,
        data: newPlot,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };
}
