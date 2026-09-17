import { Request, Response, NextFunction } from 'express';
import { TelemetryService } from '../services/telemetry.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  public recordTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batch_id, device_id, soil_moisture, temperature, notes } = req.body;

      if (!batch_id || soil_moisture === undefined) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos de telemetría incompletos: batch_id y soil_moisture son obligatorios.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.telemetryService.processTelemetry({
        batch_id,
        device_id,
        soil_moisture: parseFloat(soil_moisture),
        temperature: temperature !== undefined ? parseFloat(temperature) : undefined,
        notes
      });

      res.status(201).json({
        success: true,
        data: result.event,
        actionTaken: result.actionTaken,
        valve_status: result.valve_status,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };

  public getRecentEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batchId } = req.query;
      const events = await this.telemetryService.getTelemetryHistory(batchId as string, 40);
      res.status(200).json({
        success: true,
        data: events,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };

  public triggerManualIrrigation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batch_id, duration_minutes } = req.body;
      if (!batch_id) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'batch_id es obligatorio para accionar la electroválvula.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const operatorName = req.user?.fullName || 'Operador Web';
      const result = await this.telemetryService.triggerManualIrrigation(batch_id, duration_minutes || 15, operatorName);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };
}
