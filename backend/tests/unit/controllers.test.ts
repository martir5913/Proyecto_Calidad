import { AuthController } from '../../src/controllers/auth.controller';
import { PlotController } from '../../src/controllers/plot.controller';
import { BatchController } from '../../src/controllers/batch.controller';
import { TelemetryController } from '../../src/controllers/telemetry.controller';
import { AuditController } from '../../src/controllers/audit.controller';

describe('ISO/IEC 25010 - Mantenibilidad y Modularidad: Pruebas de Controladores MVC Completos', () => {
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('AuthController', () => {
    it('Debe rechazar login si falta email o password con status 400', async () => {
      const mockAuthService: any = { login: jest.fn() };
      const controller = new AuthController(mockAuthService);

      await controller.login({ body: {} } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('Debe procesar login exitoso con status 200', async () => {
      const mockAuthService: any = {
        login: jest.fn().mockResolvedValue({ token: 'jwt-123', user: { id: 'u-1' } })
      };
      const controller = new AuthController(mockAuthService);

      await controller.login({ body: { email: 'admin@agrochain.gt', password: '123' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe manejar error en login respondiendo 401', async () => {
      const mockAuthService: any = {
        login: jest.fn().mockRejectedValue(new Error('Credenciales inválidas'))
      };
      const controller = new AuthController(mockAuthService);

      await controller.login({ body: { email: 'admin@agrochain.gt', password: 'wrong' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('Debe retornar datos del usuario autenticado en getMe', async () => {
      const controller = new AuthController({} as any);
      await controller.getMe({ user: { email: 'admin@agrochain.gt' } } as any, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('PlotController', () => {
    it('Debe listar parcelas con status 200', async () => {
      const mockPlotService: any = { getPlots: jest.fn().mockResolvedValue([{ id: 'p-1' }]) };
      const controller = new PlotController(mockPlotService);

      await controller.getPlots({ user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe crear una parcela exitosamente con status 201', async () => {
      const mockPlotService: any = { createPlot: jest.fn().mockResolvedValue({ id: 'p-new' }) };
      const controller = new PlotController(mockPlotService);

      await controller.createPlot({
        user: { tenantId: 't-1' },
        body: { code: 'P-1', name: 'Plot', crop_type: 'Avo', area_hectares: 10, wkt_polygon: 'POLYGON(...)' }
      } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('Debe retornar 400 si faltan campos al crear una parcela', async () => {
      const controller = new PlotController({} as any);
      await controller.createPlot({ body: {}, user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('BatchController', () => {
    it('Debe listar todos los lotes con status 200', async () => {
      const mockBatchService: any = { getAllBatches: jest.fn().mockResolvedValue([]) };
      const controller = new BatchController(mockBatchService);

      await controller.getAllBatches({ user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe resolver expediente QR con status 200', async () => {
      const mockBatchService: any = { getBatchDossierByQR: jest.fn().mockResolvedValue({ batch_code: 'B-1' }) };
      const controller = new BatchController(mockBatchService);

      await controller.getDossierByQR({ params: { qrPayload: 'QR-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe responder 404 si expediente QR falla', async () => {
      const mockBatchService: any = { getBatchDossierByQR: jest.fn().mockRejectedValue(new Error('No encontrado')) };
      const controller = new BatchController(mockBatchService);

      await controller.getDossierByQR({ params: { qrPayload: 'QR-NOT' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('Debe registrar cosecha con status 200', async () => {
      const mockBatchService: any = { recordHarvest: jest.fn().mockResolvedValue({ success: true }) };
      const controller = new BatchController(mockBatchService);

      await controller.recordHarvest({ params: { id: 'b-1' }, body: {}, user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe responder 422 si la cosecha es rechazada por RN-01', async () => {
      const mockBatchService: any = { recordHarvest: jest.fn().mockRejectedValue(new Error('Bloqueo RN-01')) };
      const controller = new BatchController(mockBatchService);

      await controller.recordHarvest({ params: { id: 'b-1' }, body: {}, user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    it('Debe registrar químico y responder 201', async () => {
      const mockBatchService: any = { registerChemicalApplication: jest.fn().mockResolvedValue({ id: 'c-1' }) };
      const controller = new BatchController(mockBatchService);

      await controller.registerChemical({
        params: { id: 'b-1' },
        body: { product_name: 'Fungi', active_ingredient: 'Cu', withholding_period_days: '7' },
        user: { fullName: 'Operador' }
      } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('Debe retornar 400 si faltan campos al registrar agroquímico', async () => {
      const controller = new BatchController({} as any);
      await controller.registerChemical({ params: { id: 'b-1' }, body: {} } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('TelemetryController', () => {
    it('Debe registrar telemetría y responder 201', async () => {
      const mockTelemetryService: any = {
        processTelemetry: jest.fn().mockResolvedValue({ event: { id: 'e-1' }, actionTaken: 'Ok', valve_status: 'OFF' })
      };
      const controller = new TelemetryController(mockTelemetryService);

      await controller.recordTelemetry({ body: { batch_id: 'b-1', soil_moisture: 30 } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('Debe listar eventos de telemetría con status 200', async () => {
      const mockTelemetryService: any = { getTelemetryHistory: jest.fn().mockResolvedValue([]) };
      const controller = new TelemetryController(mockTelemetryService);

      await controller.getRecentEvents({ query: {} } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe disparar riego manual con status 200', async () => {
      const mockTelemetryService: any = { triggerManualIrrigation: jest.fn().mockResolvedValue({ success: true }) };
      const controller = new TelemetryController(mockTelemetryService);

      await controller.triggerManualIrrigation({ body: { batch_id: 'b-1' }, user: { fullName: 'Admin' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe retornar 400 si no se envía batch_id en riego manual', async () => {
      const controller = new TelemetryController({} as any);
      await controller.triggerManualIrrigation({ body: {} } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('AuditController', () => {
    it('Debe listar auditorías con status 200', async () => {
      const mockAuditService: any = { getAuditsByTenant: jest.fn().mockResolvedValue([]) };
      const controller = new AuditController(mockAuditService);

      await controller.getAudits({ user: { tenantId: 't-1' } } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('Debe crear auditoría y responder 201', async () => {
      const mockAuditService: any = {
        evaluateAudit: jest.fn().mockResolvedValue({ id: 'a-1', is_compliant: true })
      };
      const controller = new AuditController(mockAuditService);

      await controller.createAudit({
        body: { batch_id: 'b-1', standard_name: 'GLOBALGAP', compliance_score: 95 },
        user: { userId: 'u-1' }
      } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('Debe retornar 400 si faltan campos al crear auditoría', async () => {
      const controller = new AuditController({} as any);
      await controller.createAudit({ body: {} } as any, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
