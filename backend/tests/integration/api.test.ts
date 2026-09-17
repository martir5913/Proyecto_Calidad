import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

// Mock de la base de datos PostgreSQL
jest.mock('../../src/config/database', () => {
  return {
    pool: {
      query: jest.fn().mockImplementation((queryText: string, params?: any[]) => {
        const q = (queryText || '').toLowerCase();

        // 1. Usuarios / Auth
        if (q.includes('from users where email = $1') || q.includes('from users')) {
          return Promise.resolve({
            rows: [{
              id: '22222222-2222-2222-2222-222222222221',
              tenant_id: '11111111-1111-1111-1111-111111111111',
              full_name: 'Ing. Fredy Martir',
              email: 'admin@agrochain.gt',
              password_hash: '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.',
              role: 'ROLE_ADMIN'
            }]
          });
        }

        // 2. Parcelas / Plots
        if (q.includes('from plots')) {
          return Promise.resolve({
            rows: [{
              id: '33333333-3333-3333-3333-333333333331',
              tenant_id: '11111111-1111-1111-1111-111111111111',
              code: 'PARC-01-AVO',
              name: 'Sector Los Volcanes',
              crop_type: 'Aguacate Hass',
              area_hectares: '12.50',
              irrigation_system: 'GOTEO_AUTOMATIZADO',
              boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7385,14.5580],[-90.7320,14.5580],[-90.7320,14.5520],[-90.7385,14.5520],[-90.7385,14.5580]]]}'
            }]
          });
        }

        // 3. Lotes y Expediente QR
        if (q.includes('from production_batches b')) {
          return Promise.resolve({
            rows: [{
              batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
              batch_code: 'BATCH-2026-AVO-001',
              qr_payload: 'QR-AGROCHAIN-AVO-2026-001',
              status: 'BLOQUEADO_CARENCIA',
              plot_id: '33333333-3333-3333-3333-333333333331',
              plot_name: 'Sector Los Volcanes',
              crop_type: 'Aguacate Hass',
              area_hectares: 12.5,
              irrigation_system: 'GOTEO_AUTOMATIZADO_ESP32',
              boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7385,14.5580],[-90.7320,14.5580],[-90.7320,14.5520],[-90.7385,14.5520],[-90.7385,14.5580]]]}',
              chemicals: [],
              events: [],
              audits: []
            }]
          });
        }

        // 4. Inserción de telemetría IoT
        if (q.includes('insert into productive_events')) {
          return Promise.resolve({
            rows: [{
              id: 'evt-generated-123',
              batch_id: params ? params[0] : 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
              device_id: params ? params[1] : 'ESP32_SECTOR_01',
              event_type: params ? params[2] : 'TELEMETRIA_IOT',
              soil_moisture: params ? params[3] : 34.5,
              temperature: params ? params[4] : 23.8,
              valve_status: params ? params[5] : 'OFF',
              notes: params ? params[6] : 'Nota',
              evidence_hash: params ? params[7] : '8f4a1c6e9d2b5a7f3e1c9d8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f',
              created_at: new Date()
            }]
          });
        }

        // 5. Consulta de eventos
        if (q.includes('from productive_events')) {
          return Promise.resolve({
            rows: [{
              id: 'evt-1',
              batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
              batch_code: 'BATCH-2026-AVO-001',
              device_id: 'ESP32_SECTOR_01',
              event_type: 'TELEMETRIA_IOT',
              soil_moisture: '34.50',
              temperature: '23.80',
              valve_status: 'OFF',
              created_at: new Date()
            }]
          });
        }

        // 6. Auditorías
        if (q.includes('from quality_audits') || q.includes('insert into quality_audits')) {
          return Promise.resolve({
            rows: [{
              id: 'audit-1',
              batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
              inspector_id: '22222222-2222-2222-2222-222222222221',
              standard_name: 'GLOBALGAP',
              compliance_score: '96.50',
              is_compliant: true,
              observations: 'Aprobado',
              batch_code: 'BATCH-2026-AVO-001',
              inspector_name: 'Ing. Fredy Martir',
              created_at: new Date()
            }]
          });
        }

        return Promise.resolve({ rows: [] });
      })
    },
    initializeDatabase: jest.fn().mockResolvedValue(undefined)
  };
});

describe('ISO/IEC/IEEE 29119 - Pruebas de Integración de Endpoints REST API', () => {
  let authToken: string;

  beforeAll(() => {
    // Generar token JWT válido para las pruebas
    const JWT_SECRET = process.env.JWT_SECRET || 'agrochain-quality-super-secret-key-2026';
    authToken = jwt.sign({
      userId: '22222222-2222-2222-2222-222222222221',
      tenantId: '11111111-1111-1111-1111-111111111111',
      email: 'admin@agrochain.gt',
      role: 'ROLE_ADMIN',
      fullName: 'Ing. Fredy Martir'
    }, JWT_SECRET, { expiresIn: '1h' });
  });

  describe('GET /api/v1/health', () => {
    it('Debe responder HTTP 200 con estado UP y normas ISO declaradas', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('UP');
      expect(response.body.standards).toContain('ISO/IEC 25010');
      expect(response.body.standards).toContain('ISO/IEC/IEEE 29119');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('Debe autenticar y devolver token JWT', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@agrochain.gt', password: 'Password123!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('POST /api/v1/iot/telemetry', () => {
    it('Debe registrar la telemetría del sensor ESP32 y retornar HTTP 201', async () => {
      const payload = {
        batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
        device_id: 'ESP32_SECTOR_01',
        soil_moisture: 32.5,
        temperature: 24.2
      };

      const response = await request(app)
        .post('/api/v1/iot/telemetry')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body).toHaveProperty('valve_status');
    });

    it('Debe rechazar peticiones con parámetros faltantes con HTTP 400', async () => {
      const response = await request(app)
        .post('/api/v1/iot/telemetry')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/batches/:qrPayload/dossier', () => {
    it('Debe resolver el expediente trazable mediante el código QR con HTTP 200', async () => {
      const response = await request(app)
        .get('/api/v1/batches/QR-AGROCHAIN-AVO-2026-001/dossier');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch_code).toBe('BATCH-2026-AVO-001');
      expect(response.body.data._compliance_rn05).toBe(true);
    });
  });

  describe('GET /api/v1/plots (Seguridad y RBAC)', () => {
    it('Debe devolver la lista de parcelas con polígonos GeoJSON cuando se envía token válido', async () => {
      const response = await request(app)
        .get('/api/v1/plots')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Debe denegar el acceso con HTTP 401 si no se envía el header Authorization', async () => {
      const response = await request(app).get('/api/v1/plots');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/iot/irrigation/manual (Control de Electroválvula)', () => {
    it('Debe accionar el riego manual de emergencia cuando el usuario tiene permisos RBAC', async () => {
      const response = await request(app)
        .post('/api/v1/iot/irrigation/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431', duration_minutes: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('RIEGO ACTIVADO');
    });
  });

  describe('GET /api/v1/audits (Auditoría de Inocuidad)', () => {
    it('Debe listar las auditorías de calidad registradas para el inquilino', async () => {
      const response = await request(app)
        .get('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
