import { TelemetryService } from '../../src/services/telemetry.service';
import { TelemetryRepository } from '../../src/repositories/telemetry.repository';

describe('ISO/IEC 25010 - Fiabilidad y Seguridad: Pruebas Unitarias de Telemetría IoT y Riego', () => {
  let mockTelemetryRepo: jest.Mocked<TelemetryRepository>;
  let telemetryService: TelemetryService;

  beforeEach(() => {
    mockTelemetryRepo = {
      insertEvent: jest.fn().mockImplementation((evt) => Promise.resolve({ id: 'evt-generated-id', ...evt, created_at: new Date() })),
      getRecentEvents: jest.fn().mockResolvedValue([]),
      getLatestTelemetry: jest.fn().mockResolvedValue({ id: 'e-1', soil_moisture: 35.0, temperature: 24.0, valve_status: 'OFF' } as any),
    } as any;

    telemetryService = new TelemetryService(mockTelemetryRepo);
  });

  describe('Control Automático de Riego y Tolerancia a Fallos', () => {
    it('Debe ACTIVAR la electroválvula (valve_status = "ON") si la humedad de suelo es inferior a 25.0%', async () => {
      const result = await telemetryService.processTelemetry({
        batch_id: 'batch-001',
        device_id: 'ESP32_SECTOR_01',
        soil_moisture: 18.5, // Suelo seco
        temperature: 28.0
      });

      expect(result.valve_status).toBe('ON');
      expect(result.actionTaken).toContain('ALERTA SEQUEDAD');
      expect(result.actionTaken).toContain('ACTIVADA');
      expect(mockTelemetryRepo.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          valve_status: 'ON',
          soil_moisture: 18.5
        })
      );
    });

    it('Debe MANTENER CERRADA la electroválvula (valve_status = "OFF") si la humedad de suelo es óptima (>= 25.0%)', async () => {
      const result = await telemetryService.processTelemetry({
        batch_id: 'batch-001',
        device_id: 'ESP32_SECTOR_01',
        soil_moisture: 42.0, // Humedad adecuada
        temperature: 22.5
      });

      expect(result.valve_status).toBe('OFF');
      expect(result.actionTaken).toContain('Humedad óptima');
      expect(mockTelemetryRepo.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          valve_status: 'OFF',
          soil_moisture: 42.0
        })
      );
    });

    it('Debe acotar lecturas fuera de rango (0-100%) para evitar datos anómalos', async () => {
      const resultUnder = await telemetryService.processTelemetry({
        batch_id: 'batch-001',
        soil_moisture: -15 // Anómalo negativo
      });
      expect(resultUnder.event.soil_moisture).toBe(0);

      const resultOver = await telemetryService.processTelemetry({
        batch_id: 'batch-001',
        soil_moisture: 140 // Anómalo superior
      });
      expect(resultOver.event.soil_moisture).toBe(100);
    });

    it('Debe consultar historial y último estado de telemetría', async () => {
      const history = await telemetryService.getTelemetryHistory('b-1', 20);
      expect(Array.isArray(history)).toBe(true);

      const latest = await telemetryService.getLatestStatus('b-1');
      expect(latest?.soil_moisture).toBe(35.0);
    });
  });

  describe('Regla RN-06: Cadena de Custodia e Integridad de Evidencia (SHA-256)', () => {
    it('Debe calcular un hash SHA-256 no nulo de 64 caracteres hexadecimales para cada evento registrado', async () => {
      const result = await telemetryService.processTelemetry({
        batch_id: 'batch-audit-test',
        device_id: 'ESP32_DEV_TEST',
        soil_moisture: 35.0,
        temperature: 25.0
      });

      expect(result.event.evidence_hash).toBeDefined();
      expect(result.event.evidence_hash).toHaveLength(64);
      expect(result.event.evidence_hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Riego Manual de Emergencia desde Consola Web', () => {
    it('Debe generar un evento de tipo RIEGO con electroválvula encendida y hash de auditoría', async () => {
      const result = await telemetryService.triggerManualIrrigation('batch-001', 20, 'Ing. Agrónomo');

      expect(result.success).toBe(true);
      expect(result.message).toContain('RIEGO ACTIVADO por 20 minutos');
      expect(mockTelemetryRepo.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'RIEGO',
          valve_status: 'ON',
          device_id: 'WEB_CONSOLE_MANUAL'
        })
      );
    });
  });
});
