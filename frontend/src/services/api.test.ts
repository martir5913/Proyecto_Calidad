import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from './api';
import { User } from '../types';

function mockFetchOnce(body: any, ok = true) {
  (global.fetch as any) = vi.fn().mockResolvedValueOnce({
    ok,
    json: async () => body
  });
}

const sampleUser: User = {
  id: 'u1',
  tenant_id: 't1',
  full_name: 'Ing. Fredy Martir',
  email: 'admin@agrochain.gt',
  role: 'ROLE_ADMIN'
};

describe('ApiService - Sesión y Autenticación (Seguridad ISO 25010)', () => {
  beforeEach(() => {
    localStorage.clear();
    ApiService.logout();
  });

  it('inicia sesión exitosamente y persiste el token JWT en localStorage', async () => {
    mockFetchOnce({ success: true, data: { token: 'jwt-abc123', user: sampleUser } });

    const res = await ApiService.login('admin@agrochain.gt', 'Password123!');

    expect(res.success).toBe(true);
    expect(ApiService.getToken()).toBe('jwt-abc123');
    expect(localStorage.getItem('agro_token')).toBe('jwt-abc123');
    expect(ApiService.getCurrentUser()?.email).toBe('admin@agrochain.gt');
  });

  it('retorna mensaje de error si las credenciales son inválidas', async () => {
    mockFetchOnce({ success: false, message: 'Credenciales inválidas.' });

    const res = await ApiService.login('admin@agrochain.gt', 'malaClave');

    expect(res.success).toBe(false);
    expect(res.message).toBe('Credenciales inválidas.');
    expect(ApiService.getToken()).toBe('');
  });

  it('captura errores de red y retorna un mensaje amigable en lugar de lanzar excepción', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('Network down'));

    const res = await ApiService.login('admin@agrochain.gt', 'Password123!');

    expect(res.success).toBe(false);
    expect(res.message).toBe('Network down');
  });

  it('recupera el usuario actual desde localStorage tras recargar la página (sesión persistente)', () => {
    localStorage.setItem('agro_token', 'jwt-persisted');
    localStorage.setItem('agro_user', JSON.stringify(sampleUser));

    expect(ApiService.getToken()).toBe('jwt-persisted');
    expect(ApiService.getCurrentUser()?.full_name).toBe('Ing. Fredy Martir');
  });

  it('retorna null si el usuario guardado en localStorage está corrupto', () => {
    localStorage.setItem('agro_user', '{json-invalido');

    expect(ApiService.getCurrentUser()).toBeNull();
  });

  it('limpia token y usuario al cerrar sesión (logout)', async () => {
    mockFetchOnce({ success: true, data: { token: 'jwt-abc123', user: sampleUser } });
    await ApiService.login('admin@agrochain.gt', 'Password123!');

    ApiService.logout();

    expect(ApiService.getToken()).toBe('');
    expect(ApiService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem('agro_token')).toBeNull();
  });
});

describe('ApiService - Consultas de Datos (Resiliencia ante fallas de backend)', () => {
  beforeEach(() => {
    localStorage.clear();
    ApiService.logout();
  });

  it('getPlots retorna las parcelas del backend cuando la petición es exitosa', async () => {
    mockFetchOnce({
      success: true,
      data: [{ id: 'p1', code: 'PARC-01', name: 'Sector 1', crop_type: 'Café', area_hectares: 5, irrigation_system: 'GOTEO' }]
    });

    const plots = await ApiService.getPlots();

    expect(plots).toHaveLength(1);
    expect(plots[0].code).toBe('PARC-01');
  });

  it('getPlots retorna datos semilla de contingencia si el backend falla (tolerancia a fallos)', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('backend caído'));

    const plots = await ApiService.getPlots();

    expect(plots.length).toBeGreaterThan(0);
    expect(plots[0].code).toBe('PARC-01-AVO');
  });

  it('getBatchDossier resuelve el expediente QR real desde el backend', async () => {
    mockFetchOnce({
      success: true,
      data: {
        batch_id: 'b1',
        batch_code: 'BATCH-TEST',
        qr_payload: 'QR-TEST',
        status: 'LIBERADO_COSECHA',
        chemicals: [],
        events: [],
        audits: []
      }
    });

    const dossier = await ApiService.getBatchDossier('QR-TEST');

    expect(dossier.batch_code).toBe('BATCH-TEST');
    expect(dossier.status).toBe('LIBERADO_COSECHA');
  });

  it('getBatchDossier retorna un expediente simulado de contingencia si el backend no responde (RN-05)', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('timeout'));

    const dossier = await ApiService.getBatchDossier('QR-AGROCHAIN-AVO-2026-001');

    expect(dossier.status).toBe('BLOQUEADO_CARENCIA');
    expect(dossier.chemicals.length).toBeGreaterThan(0);
    expect(dossier._compliance_rn05).toBe(true);
  });

  it('getRecentEvents retorna arreglo vacío si el backend falla, sin lanzar excepción', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('offline'));

    const events = await ApiService.getRecentEvents();

    expect(events).toEqual([]);
  });

  it('getAudits retorna arreglo vacío si el backend falla, sin lanzar excepción', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('offline'));

    const audits = await ApiService.getAudits();

    expect(audits).toEqual([]);
  });

  it('recordHarvest envía el batchId y retorna la respuesta del backend (Regla RN-01)', async () => {
    mockFetchOnce({ success: false, message: "Bloqueo RN-01: Período de carencia activo." });

    const res = await ApiService.recordHarvest('batch-1');

    expect(res.success).toBe(false);
    expect(res.message).toContain('RN-01');
  });

  it('sendTelemetry envía la lectura del sensor al backend (RN-06)', async () => {
    mockFetchOnce({ success: true, valve_status: 'ON', actionTaken: 'Electroválvula activada' });

    const res = await ApiService.sendTelemetry({ batch_id: 'b1', soil_moisture: 15 });

    expect(res.success).toBe(true);
    expect(res.valve_status).toBe('ON');
  });

  it('triggerManualIrrigation invoca el endpoint de riego manual con la duración indicada', async () => {
    mockFetchOnce({ success: true });

    const res = await ApiService.triggerManualIrrigation('batch-1', 20);

    expect(res.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/iot/irrigation/manual',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('getRecentEvents retorna los eventos del backend cuando se filtra por batchId', async () => {
    mockFetchOnce({ success: true, data: [{ batch_id: 'b1', device_id: 'd1', event_type: 'TELEMETRIA_IOT', created_at: new Date().toISOString() }] });

    const events = await ApiService.getRecentEvents('b1');

    expect(events).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/iot/events?batchId=b1');
  });

  it('getAudits retorna las auditorías del backend cuando la petición es exitosa', async () => {
    mockFetchOnce({
      success: true,
      data: [{ id: 'a1', batch_id: 'b1', standard_name: 'GLOBALGAP', compliance_score: 96, is_compliant: true, created_at: new Date().toISOString() }]
    });

    const audits = await ApiService.getAudits();

    expect(audits).toHaveLength(1);
    expect(audits[0].standard_name).toBe('GLOBALGAP');
  });

  it('getBatchDossier de contingencia genera un expediente de Café (no-aguacate) cuando el QR no coincide con el lote 001', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('timeout'));

    const dossier = await ApiService.getBatchDossier('QR-AGROCHAIN-COF-2026-002');

    expect(dossier.status).toBe('LIBERADO_COSECHA');
    expect(dossier.crop_type).toBe('Café Arábica Especial');
    expect(dossier.chemicals[0].product_name).toBe('Extracto de Neem Orgánico BioProtect');
  });
});
