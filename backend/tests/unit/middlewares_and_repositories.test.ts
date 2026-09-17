import { authMiddleware, requireRoles } from '../../src/middlewares/auth.middleware';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { UserRepository } from '../../src/repositories/user.repository';
import { PlotRepository } from '../../src/repositories/plot.repository';
import { BatchRepository } from '../../src/repositories/batch.repository';
import { TelemetryRepository } from '../../src/repositories/telemetry.repository';
import { AuditRepository } from '../../src/repositories/audit.repository';
import jwt from 'jsonwebtoken';

describe('ISO/IEC 25010 - Mantenibilidad: Pruebas de Middlewares y Capa de Repositorios', () => {
  describe('Middlewares', () => {
    let mockReq: any;
    let mockRes: any;
    let next: any;

    beforeEach(() => {
      mockReq = { headers: {} };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('authMiddleware debe responder 401 si no hay cabecera Authorization', () => {
      authMiddleware(mockReq, mockRes, next);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('authMiddleware debe responder 401 si el token es inválido', () => {
      mockReq.headers.authorization = 'Bearer token-invalido';
      authMiddleware(mockReq, mockRes, next);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('authMiddleware debe llamar a next() si el token JWT es válido', () => {
      const token = jwt.sign({ userId: 'u-1', role: 'ROLE_ADMIN' }, 'agrochain-quality-super-secret-key-2026');
      mockReq.headers.authorization = `Bearer ${token}`;
      authMiddleware(mockReq, mockRes, next);
      expect(next).toHaveBeenCalled();
      expect(mockReq.user.userId).toBe('u-1');
    });

    it('requireRoles debe responder 401 si no hay usuario en req', () => {
      mockReq.user = undefined;
      const guard = requireRoles('ROLE_ADMIN');
      guard(mockReq, mockRes, next);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('requireRoles debe responder 403 si el rol no coincide', () => {
      mockReq.user = { role: 'ROLE_AUDITOR' };
      const guard = requireRoles('ROLE_ADMIN');
      guard(mockReq, mockRes, next);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('requireRoles debe permitir acceso si el rol coincide', () => {
      mockReq.user = { role: 'ROLE_ADMIN' };
      const guard = requireRoles('ROLE_ADMIN', 'ROLE_QA_INSP');
      guard(mockReq, mockRes, next);
      expect(next).toHaveBeenCalled();
    });

    it('errorHandler debe formatear excepciones como JSON estándar', () => {
      const err = new Error('Fallo simulado');
      errorHandler(err, mockReq, mockRes, next);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Fallo simulado' }));
    });
  });

  describe('Capa de Repositorios (Data Access Layer)', () => {
    let mockPool: any;

    beforeEach(() => {
      mockPool = {
        query: jest.fn().mockResolvedValue({ rows: [] })
      };
    });

    it('UserRepository debe ejecutar consultas por id y tenant', async () => {
      const repo = new UserRepository(mockPool);
      await repo.findById('u-1');
      await repo.listByTenant('t-1');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('PlotRepository debe consultar y parsear parcelas y crear', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'p-1', code: 'P-1', area_hectares: '10.5' }]
      });
      const repo = new PlotRepository(mockPool);
      const plots = await repo.findAllByTenant('t-1');
      expect(plots[0].area_hectares).toBe(10.5);

      const single = await repo.findById('p-1', 't-1');
      expect(single?.area_hectares).toBe(10.5);

      const created = await repo.create({
        tenant_id: 't-1',
        code: 'P-1',
        name: 'Plot',
        crop_type: 'Avo',
        area_hectares: 10.5,
        irrigation_system: 'GOTEO'
      }, 'POLYGON(...)');
      expect(created.area_hectares).toBe(10.5);
    });

    it('BatchRepository debe ejecutar queries de lotes e insumos', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'b-1', product_name: 'Fungicida' }]
      });
      const repo = new BatchRepository(mockPool);
      await repo.findAllByTenant('t-1');
      await repo.findById('b-1', 't-1');
      await repo.findByQRPayload('QR-1');
      await repo.findByQRPayload('QR-1', 't-1');
      await repo.getLatestChemicalApplication('b-1');
      await repo.updateStatus('b-1', 'COSECHADO');
      await repo.updateStatus('b-1', 'COSECHADO', new Date());
      await repo.addChemicalApplication({
        batch_id: 'b-1',
        product_name: 'Bio',
        active_ingredient: 'Extract',
        dosage: '1L',
        application_date: new Date(),
        withholding_period_days: 7,
        safe_harvest_date: new Date()
      });
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('TelemetryRepository debe consultar historial, insertar y ultimo evento', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'e-1', soil_moisture: '35.0', temperature: '24.0', valve_status: 'OFF' }]
      });
      const repo = new TelemetryRepository(mockPool);
      await repo.insertEvent({
        batch_id: 'b-1',
        device_id: 'ESP32',
        event_type: 'TELEMETRIA_IOT',
        soil_moisture: 35.0,
        temperature: 24.0
      });
      await repo.getRecentEvents();
      await repo.getRecentEvents('b-1', 10);
      await repo.getLatestTelemetry('b-1');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('AuditRepository debe crear y consultar auditorías por tenant', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'a-1', compliance_score: '95.0' }]
      });
      const repo = new AuditRepository(mockPool);
      await repo.create({
        batch_id: 'b-1',
        inspector_id: 'u-1',
        standard_name: 'GLOBALGAP',
        compliance_score: 95.0,
        is_compliant: true
      });
      const audits = await repo.findAllByTenant('t-1');
      expect(audits[0].compliance_score).toBe(95.0);
    });
  });
});
