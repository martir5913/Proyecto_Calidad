import { BatchService } from '../../src/services/batch.service';
import { BatchRepository } from '../../src/repositories/batch.repository';
import { ChemicalApplication, ProductionBatch } from '../../src/models/types';

describe('ISO/IEC 25010 - Adecuación Funcional: Pruebas Unitarias de Reglas de Negocio (RN-01 y RN-05)', () => {
  let mockBatchRepo: jest.Mocked<BatchRepository>;
  let batchService: BatchService;

  beforeEach(() => {
    mockBatchRepo = {
      findAllByTenant: jest.fn(),
      findById: jest.fn(),
      findByQRPayload: jest.fn(),
      getLatestChemicalApplication: jest.fn(),
      updateStatus: jest.fn(),
      addChemicalApplication: jest.fn(),
    } as any;

    batchService = new BatchService(mockBatchRepo);
  });

  describe('Regla RN-01: Validación de Período de Carencia Fitosanitaria', () => {
    it('Debe BLOQUEAR la cosecha si la fecha actual está DENTRO del período de carencia activo', async () => {
      const mockApplication: ChemicalApplication = {
        id: 'chem-001',
        batch_id: 'batch-123',
        product_name: 'Fungicida Clorotalonil 720 SC',
        active_ingredient: 'Clorotalonil',
        dosage: '2.0 L/Ha',
        application_date: new Date('2026-09-10T00:00:00Z'),
        withholding_period_days: 14,
        safe_harvest_date: new Date('2026-09-24T00:00:00Z'), // Fecha segura futura
        created_at: new Date()
      };

      mockBatchRepo.getLatestChemicalApplication.mockResolvedValue(mockApplication);

      // Intentamos cosechar el 15 de septiembre (antes del 24)
      const testHarvestDate = new Date('2026-09-15T00:00:00Z');
      const result = await batchService.canHarvestBatch('batch-123', testHarvestDate);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Bloqueo RN-01');
      expect(result.reason).toContain('Fungicida Clorotalonil 720 SC');
    });

    it('Debe PERMITIR la cosecha si la fecha actual ha SUPERADO el período de carencia', async () => {
      const mockApplication: ChemicalApplication = {
        id: 'chem-002',
        batch_id: 'batch-123',
        product_name: 'Extracto de Neem Orgánico',
        active_ingredient: 'Azadiractina',
        dosage: '1.5 L/Ha',
        application_date: new Date('2026-08-01T00:00:00Z'),
        withholding_period_days: 7,
        safe_harvest_date: new Date('2026-08-08T00:00:00Z'), // Ya superado
        created_at: new Date()
      };

      mockBatchRepo.getLatestChemicalApplication.mockResolvedValue(mockApplication);

      // Intentamos cosechar el 17 de septiembre
      const testHarvestDate = new Date('2026-09-17T00:00:00Z');
      const result = await batchService.canHarvestBatch('batch-123', testHarvestDate);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('Debe PERMITIR la cosecha si el lote NO TIENE aplicaciones químicas registradas', async () => {
      mockBatchRepo.getLatestChemicalApplication.mockResolvedValue(null);

      const result = await batchService.canHarvestBatch('batch-clean', new Date());
      expect(result.allowed).toBe(true);
    });

    it('Debe rechazar la operación de cosecha si el lote no existe', async () => {
      mockBatchRepo.findById.mockResolvedValue(null);
      await expect(
        batchService.recordHarvest('batch-none', 'tenant-1')
      ).rejects.toThrow(/no encontrado/);
    });

    it('Debe ejecutar cosecha exitosa si se cumple RN-01', async () => {
      mockBatchRepo.findById.mockResolvedValue({ id: 'batch-ok', tenant_id: 'tenant-1' } as any);
      mockBatchRepo.getLatestChemicalApplication.mockResolvedValue(null);

      const res = await batchService.recordHarvest('batch-ok', 'tenant-1');
      expect(res.success).toBe(true);
      expect(mockBatchRepo.updateStatus).toHaveBeenCalledWith('batch-ok', 'COSECHADO', expect.any(Date));
    });

    it('Debe rechazar la operación de cosecha lanzando excepción cuando no se cumple RN-01', async () => {
      const mockBatch: ProductionBatch = {
        id: 'batch-123',
        tenant_id: 'tenant-1',
        plot_id: 'plot-1',
        batch_code: 'BATCH-001',
        qr_payload: 'QR-001',
        status: 'EN_CRECIMIENTO'
      };

      mockBatchRepo.findById.mockResolvedValue(mockBatch);
      mockBatchRepo.getLatestChemicalApplication.mockResolvedValue({
        id: 'chem-001',
        batch_id: 'batch-123',
        product_name: 'Insecticida Cipermetrina',
        active_ingredient: 'Cipermetrina',
        dosage: '1.0 L/Ha',
        application_date: new Date('2026-09-14T00:00:00Z'),
        withholding_period_days: 21,
        safe_harvest_date: new Date('2026-10-05T00:00:00Z')
      });

      await expect(
        batchService.recordHarvest('batch-123', 'tenant-1', new Date('2026-09-17T00:00:00Z'))
      ).rejects.toThrow(/Bloqueo RN-01/);
    });
  });

  describe('Regla RN-05: Resolución de Expediente QR y Tiempo de Respuesta', () => {
    it('Debe recuperar el expediente completo y marcar conformidad con RN-05', async () => {
      const mockDossier = {
        batch_id: 'batch-123',
        batch_code: 'BATCH-2026-AVO-001',
        qr_payload: 'QR-AGROCHAIN-AVO-2026-001',
        status: 'BLOQUEADO_CARENCIA',
        plot_name: 'Sector Los Volcanes',
        crop_type: 'Aguacate Hass',
        chemicals: [],
        events: [],
        audits: []
      };

      mockBatchRepo.findByQRPayload.mockResolvedValue(mockDossier);

      const result = await batchService.getBatchDossierByQR('QR-AGROCHAIN-AVO-2026-001');

      expect(result).toHaveProperty('batch_code', 'BATCH-2026-AVO-001');
      expect(result._compliance_rn05).toBe(true);
      expect(typeof result._resolution_time_ms).toBe('number');
    });

    it('Debe listar todos los lotes de un inquilino', async () => {
      mockBatchRepo.findAllByTenant.mockResolvedValue([]);
      const result = await batchService.getAllBatches('tenant-1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('Debe lanzar error si el código QR no existe en el sistema', async () => {
      mockBatchRepo.findByQRPayload.mockResolvedValue(null);

      await expect(
        batchService.getBatchDossierByQR('QR-INEXISTENTE')
      ).rejects.toThrow(/no encontrado/);
    });
  });

  describe('Registro de Aplicación Fitosanitaria y Estado de Lote', () => {
    it('Debe calcular correctamente la fecha segura de cosecha y actualizar el estado', async () => {
      const appDate = new Date('2026-09-01T10:00:00Z');
      const withholdingDays = 10;
      const expectedSafeDate = new Date(appDate.getTime() + withholdingDays * 24 * 60 * 60 * 1000);

      mockBatchRepo.addChemicalApplication.mockResolvedValue({
        id: 'new-chem-id',
        batch_id: 'batch-123',
        product_name: 'Fungicida Bio',
        active_ingredient: 'Cobre',
        dosage: '1.5 L/Ha',
        application_date: appDate,
        withholding_period_days: withholdingDays,
        safe_harvest_date: expectedSafeDate,
        applied_by: 'Operador'
      });

      const result = await batchService.registerChemicalApplication({
        batchId: 'batch-123',
        productName: 'Fungicida Bio',
        activeIngredient: 'Cobre',
        dosage: '1.5 L/Ha',
        applicationDate: appDate,
        withholdingPeriodDays: withholdingDays,
        appliedBy: 'Operador'
      });

      expect(mockBatchRepo.updateStatus).toHaveBeenCalledWith('batch-123', 'BLOQUEADO_CARENCIA');
      expect(result.safe_harvest_date).toEqual(expectedSafeDate);
    });
  });
});
