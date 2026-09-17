import { TelemetryRepository } from '../repositories/telemetry.repository';
import { ProductiveEvent, ValveStatus } from '../models/types';
import crypto from 'crypto';

export class TelemetryService {
  // Umbral crítico de humedad de suelo (%)
  public static readonly DRY_SOIL_THRESHOLD = 25.0; // % debajo del cual se activa riego
  public static readonly OPTIMAL_SOIL_THRESHOLD = 50.0; // % por encima del cual se apaga riego

  constructor(private telemetryRepo: TelemetryRepository) {}

  /**
   * Procesa la lectura enviada por el ESP32 o simulador
   * Genera el hash de evidencia SHA-256 (RN-06) y evalúa el actuador de la electroválvula
   */
  public async processTelemetry(data: {
    batch_id: string;
    device_id?: string;
    soil_moisture: number;
    temperature?: number;
    notes?: string;
  }): Promise<{ event: ProductiveEvent; actionTaken: string; valve_status: ValveStatus }> {
    const moisture = Math.max(0, Math.min(100, data.soil_moisture));
    const temp = data.temperature !== undefined ? data.temperature : 24.0;
    
    // Lógica Fail-safe y control de riego automático
    let valveStatus: ValveStatus = 'OFF';
    let actionTaken = 'Lectura normal registrada. Humedad en rango adecuado.';

    if (moisture < TelemetryService.DRY_SOIL_THRESHOLD) {
      valveStatus = 'ON';
      actionTaken = `ALERTA SEQUEDAD (${moisture}% < ${TelemetryService.DRY_SOIL_THRESHOLD}%): Electroválvula de riego ACTIVADA automáticamente.`;
    } else {
      valveStatus = 'OFF';
      actionTaken = `Humedad óptima (${moisture}% >= ${TelemetryService.DRY_SOIL_THRESHOLD}%): Electroválvula CERRADA.`;
    }

    // RN-06: Generación de hash SHA-256 para integridad de la bitácora
    const rawPayload = `${data.batch_id}|${data.device_id || 'ESP32'}|${moisture}|${temp}|${Date.now()}`;
    const evidenceHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const createdEvent = await this.telemetryRepo.insertEvent({
      batch_id: data.batch_id,
      device_id: data.device_id || 'ESP32_SECTOR_01',
      event_type: 'TELEMETRIA_IOT',
      soil_moisture: moisture,
      temperature: temp,
      valve_status: valveStatus,
      notes: data.notes || actionTaken,
      evidence_hash: evidenceHash
    });

    return {
      event: createdEvent,
      actionTaken,
      valve_status: valveStatus
    };
  }

  /**
   * Ejecuta un comando de riego forzado manual
   */
  public async triggerManualIrrigation(batchId: string, durationMinutes: number = 15, operatorName: string = 'Operador Web') {
    const rawPayload = `MANUAL_RIEGO|${batchId}|${durationMinutes}|${Date.now()}`;
    const evidenceHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const event = await this.telemetryRepo.insertEvent({
      batch_id: batchId,
      device_id: 'WEB_CONSOLE_MANUAL',
      event_type: 'RIEGO',
      soil_moisture: undefined,
      temperature: undefined,
      valve_status: 'ON',
      notes: `Riego manual de emergencia forzado por ${operatorName} (${durationMinutes} minutos)`,
      evidence_hash: evidenceHash
    });

    return {
      success: true,
      event,
      message: `Comando de electroválvula enviado: RIEGO ACTIVADO por ${durationMinutes} minutos.`
    };
  }

  public async getTelemetryHistory(batchId?: string, limit: number = 25) {
    return await this.telemetryRepo.getRecentEvents(batchId, limit);
  }

  public async getLatestStatus(batchId: string) {
    return await this.telemetryRepo.getLatestTelemetry(batchId);
  }
}
