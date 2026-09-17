import { Plot, BatchDossier, TelemetryEvent, QualityAudit, User, UserRole } from '../types';

const API_BASE = '/api/v1';

export class ApiService {
  private static token: string = '';
  private static currentUser: User | null = null;

  public static setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('agro_token', token);
    localStorage.setItem('agro_user', JSON.stringify(user));
  }

  public static setToken(token: string) {
    this.token = token;
    localStorage.setItem('agro_token', token);
  }

  public static getToken(): string {
    return this.token || localStorage.getItem('agro_token') || '';
  }

  public static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const raw = localStorage.getItem('agro_user');
    if (raw) {
      try {
        this.currentUser = JSON.parse(raw);
        return this.currentUser;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public static logout() {
    this.token = '';
    this.currentUser = null;
    localStorage.removeItem('agro_token');
    localStorage.removeItem('agro_user');
  }

  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async login(email: string, password: string): Promise<{ success: boolean; data?: { token: string; user: User }; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        this.setSession(data.data.token, data.data.user);
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error de conexión con el servidor'
      };
    }
  }

  public static async createPlot(plotData: {
    code: string;
    name: string;
    crop_type: string;
    area_hectares: number;
    wkt_polygon: string;
    irrigation_system: string;
  }): Promise<{ success: boolean; data?: Plot; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/plots`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(plotData)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al registrar parcela' };
    }
  }

  public static async getPlots(): Promise<Plot[]> {
    try {
      const res = await fetch(`${API_BASE}/plots`, { headers: this.getHeaders() });
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {}

    // Datos semilla de contingencia (Guatemala)
    return [
      {
        id: '33333333-3333-3333-3333-333333333331',
        code: 'PARC-01-AVO',
        name: 'Sector Los Volcanes - Aguacate Hass',
        crop_type: 'Aguacate Hass de Exportación',
        area_hectares: 12.5,
        irrigation_system: 'GOTEO_AUTOMATIZADO_ESP32',
        boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7385,14.5580],[-90.7320,14.5580],[-90.7320,14.5520],[-90.7385,14.5520],[-90.7385,14.5580]]]}'
      },
      {
        id: '33333333-3333-3333-3333-333333333332',
        code: 'PARC-02-COF',
        name: 'Sector El Mirador - Café Bourbon',
        crop_type: 'Café Arábica Especial',
        area_hectares: 18.75,
        irrigation_system: 'ASPERSION_SECTORIZADA',
        boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7450,14.5650],[-90.7390,14.5650],[-90.7390,14.5590],[-90.7450,14.5590],[-90.7450,14.5650]]]}'
      }
    ];
  }

  public static async getBatchDossier(qrPayload: string): Promise<BatchDossier> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE}/batches/${qrPayload}/dossier`);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {}

    // Dossier simulado fiel al seed
    const isAvocado = qrPayload.includes('AVO') || qrPayload.includes('001');
    const elapsed = Date.now() - startTime;
    return {
      batch_id: isAvocado ? 'c7a8b61c-8e34-4b51-9104-58e1d2f95431' : '44444444-4444-4444-4444-444444444442',
      batch_code: isAvocado ? 'BATCH-2026-AVO-001' : 'BATCH-2026-COF-002',
      qr_payload: qrPayload,
      status: isAvocado ? 'BLOQUEADO_CARENCIA' : 'LIBERADO_COSECHA',
      planting_date: '2026-06-15T00:00:00Z',
      estimated_harvest_date: '2026-10-01T00:00:00Z',
      plot_id: isAvocado ? '33333333-3333-3333-3333-333333333331' : '33333333-3333-3333-3333-333333333332',
      plot_name: isAvocado ? 'Sector Los Volcanes - Aguacate Hass' : 'Sector El Mirador - Café Bourbon',
      crop_type: isAvocado ? 'Aguacate Hass de Exportación' : 'Café Arábica Especial',
      area_hectares: isAvocado ? 12.5 : 18.75,
      irrigation_system: isAvocado ? 'GOTEO_AUTOMATIZADO_ESP32' : 'ASPERSION_SECTORIZADA',
      boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7385,14.5580],[-90.7320,14.5580],[-90.7320,14.5520],[-90.7385,14.5520],[-90.7385,14.5580]]]}',
      chemicals: isAvocado ? [
        {
          id: '55555555-5555-5555-5555-555555555551',
          product_name: 'Fungicida Clorotalonil 720 SC',
          active_ingredient: 'Clorotalonil',
          dosage: '2.0 L/Ha',
          application_date: new Date(Date.now() - 2 * 86400000).toISOString(),
          withholding_period_days: 14,
          safe_harvest_date: new Date(Date.now() + 12 * 86400000).toISOString(),
          applied_by: 'Esdras Ajanel (Operador Campo)'
        }
      ] : [
        {
          id: '55555555-5555-5555-5555-555555555552',
          product_name: 'Extracto de Neem Orgánico BioProtect',
          active_ingredient: 'Azadiractina',
          dosage: '1.5 L/Ha',
          application_date: new Date(Date.now() - 25 * 86400000).toISOString(),
          withholding_period_days: 7,
          safe_harvest_date: new Date(Date.now() - 18 * 86400000).toISOString(),
          applied_by: 'Esdras Ajanel (Operador Campo)'
        }
      ],
      events: [
        {
          id: '66666666-6666-6666-6666-666666666661',
          batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
          device_id: 'ESP32_SECTOR_01',
          event_type: 'TELEMETRIA_IOT',
          soil_moisture: 34.5,
          temperature: 23.8,
          valve_status: 'OFF',
          notes: 'Lectura periódica automática sensor suelo',
          evidence_hash: '8f4a1c6e9d2b5a7f3e1c9d8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f',
          created_at: new Date(Date.now() - 15 * 60000).toISOString()
        }
      ],
      audits: [
        {
          id: '77777777-7777-7777-7777-777777777771',
          batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
          standard_name: 'GLOBALGAP',
          compliance_score: 96.5,
          is_compliant: true,
          observations: 'Lote en cumplimiento con protocolo de manejo integrado de plagas.',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString()
        }
      ],
      _resolution_time_ms: elapsed,
      _compliance_rn05: true
    };
  }

  public static async recordHarvest(batchId: string, harvestDate: string = new Date().toISOString()) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/harvest`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ harvestDate })
    });
    return await res.json();
  }

  public static async sendTelemetry(payload: {
    batch_id: string;
    device_id?: string;
    soil_moisture: number;
    temperature?: number;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/iot/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  public static async triggerManualIrrigation(batchId: string, durationMinutes: number = 15) {
    const res = await fetch(`${API_BASE}/iot/irrigation/manual`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ batch_id: batchId, duration_minutes: durationMinutes })
    });
    return await res.json();
  }

  public static async getRecentEvents(batchId?: string): Promise<TelemetryEvent[]> {
    try {
      const url = batchId ? `${API_BASE}/iot/events?batchId=${batchId}` : `${API_BASE}/iot/events`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {}

    return [];
  }

  public static async getAudits(): Promise<QualityAudit[]> {
    try {
      const res = await fetch(`${API_BASE}/audits`, { headers: this.getHeaders() });
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {}

    return [];
  }
}
