import { BatchRepository } from '../repositories/batch.repository';
import { ChemicalApplication } from '../models/types';

export class BatchService {
  constructor(private batchRepo: BatchRepository) {}

  /**
   * RN-01: Validación obligatoria del período de carencia antes de cosechar
   */
  public async canHarvestBatch(batchId: string, harvestDate: Date = new Date()): Promise<{ allowed: boolean; reason?: string; safeDate?: Date }> {
    const lastApplication = await this.batchRepo.getLatestChemicalApplication(batchId);

    if (lastApplication) {
      const safeDate = new Date(lastApplication.safe_harvest_date);
      if (harvestDate < safeDate) {
        return {
          allowed: false,
          safeDate,
          reason: `Bloqueo RN-01: Período de carencia activo para el insumo '${lastApplication.product_name}'. Cosecha no permitida antes de ${safeDate.toISOString()}`
        };
      }
    }
    return { allowed: true };
  }

  /**
   * RN-05: Resolución del expediente completo trazable por QR (Objetivo <= 1.5s)
   */
  public async getBatchDossierByQR(qrPayload: string, tenantId?: string) {
    const startTime = Date.now();
    const dossier = await this.batchRepo.findByQRPayload(qrPayload, tenantId);
    const durationMs = Date.now() - startTime;

    if (!dossier) {
      throw new Error(`Expediente o Lote con código QR '${qrPayload}' no encontrado.`);
    }

    return {
      ...dossier,
      _resolution_time_ms: durationMs,
      _compliance_rn05: durationMs <= 1500
    };
  }

  public async getAllBatches(tenantId: string) {
    return await this.batchRepo.findAllByTenant(tenantId);
  }

  public async recordHarvest(batchId: string, tenantId: string, harvestDate: Date = new Date()) {
    const batch = await this.batchRepo.findById(batchId, tenantId);
    if (!batch) {
      throw new Error('Lote productivo no encontrado.');
    }

    const check = await this.canHarvestBatch(batchId, harvestDate);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    await this.batchRepo.updateStatus(batchId, 'COSECHADO', harvestDate);
    return {
      success: true,
      batchId,
      status: 'COSECHADO',
      harvestDate,
      message: 'Cosecha registrada y validada conforme a normativa de inocuidad.'
    };
  }

  public async registerChemicalApplication(data: {
    batchId: string;
    productName: string;
    activeIngredient: string;
    dosage: string;
    applicationDate: Date;
    withholdingPeriodDays: number;
    appliedBy?: string;
  }): Promise<ChemicalApplication> {
    const safeHarvestDate = new Date(data.applicationDate.getTime() + data.withholdingPeriodDays * 24 * 60 * 60 * 1000);

    const created = await this.batchRepo.addChemicalApplication({
      batch_id: data.batchId,
      product_name: data.productName,
      active_ingredient: data.activeIngredient,
      dosage: data.dosage,
      application_date: data.applicationDate,
      withholding_period_days: data.withholdingPeriodDays,
      safe_harvest_date: safeHarvestDate,
      applied_by: data.appliedBy
    });

    // Actualizamos el estado del lote a BLOQUEADO_CARENCIA
    await this.batchRepo.updateStatus(data.batchId, 'BLOQUEADO_CARENCIA');

    return created;
  }
}
