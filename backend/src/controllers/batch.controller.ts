import { Request, Response, NextFunction } from 'express';
import { BatchService } from '../services/batch.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class BatchController {
  constructor(private batchService: BatchService) {}

  public getAllBatches = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
      const batches = await this.batchService.getAllBatches(tenantId);
      res.status(200).json({
        success: true,
        data: batches,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };

  public getDossierByQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { qrPayload } = req.params;
      const dossier = await this.batchService.getBatchDossierByQR(qrPayload);
      res.status(200).json({
        success: true,
        data: dossier,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  public recordHarvest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
      const { harvestDate } = req.body;

      const dateObj = harvestDate ? new Date(harvestDate) : new Date();
      const result = await this.batchService.recordHarvest(id, tenantId, dateObj);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(422).json({
        success: false,
        statusCode: 422,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  public registerChemical = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { product_name, active_ingredient, dosage, application_date, withholding_period_days, applied_by } = req.body;

      if (!product_name || !active_ingredient || !withholding_period_days) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Campos requeridos: product_name, active_ingredient, withholding_period_days.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const appDate = application_date ? new Date(application_date) : new Date();
      const created = await this.batchService.registerChemicalApplication({
        batchId: id,
        productName: product_name,
        activeIngredient: active_ingredient,
        dosage: dosage || 'Dosis Estándar',
        applicationDate: appDate,
        withholdingPeriodDays: parseInt(withholding_period_days, 10),
        appliedBy: applied_by || req.user?.fullName || 'Operador de Campo'
      });

      res.status(201).json({
        success: true,
        data: created,
        message: `Insumo registrado. El lote ha sido marcado como BLOQUEADO_CARENCIA por ${withholding_period_days} días.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  };
}
