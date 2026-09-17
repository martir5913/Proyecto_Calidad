# GUIA DE IMPLEMENTACION: AGROCHAIN ERP (PORTAL WEB Y NUCLEO IOT)

## 1. VISION GENERAL Y ESPECIFICACION TECNICA
Este documento contiene las especificaciones y directivas paso a paso para que un agente de IA o desarrollador despliegue el prototipo funcional y reproducible de **AgroChain ERP**.
El alcance prioritario cubre el **Portal Web Administrativo Responsive**, la **API REST Modular**, la persistencia en **PostgreSQL con PostGIS**, la suite de **pruebas automatizadas estructuradas para evaluacion externa (ISO/IEC/IEEE 29119 e ISO/IEC 25010)** y un **firmware para microcontrolador ESP32** encargado de la captura de telemetria de campo (humedad y temperatura de suelo).

### Pila Tecnologica Obligatoria
- **Base de Datos:** PostgreSQL 16 con extension espacial PostGIS.
- **Backend:** Node.js 22 LTS con arquitectura modular limpia (NestJS o Express estructurado en capas) y TypeScript.
- **Frontend:** SPA con React 18, TypeScript, Vite y Bootstrap 5 para garantizar diseno responsivo para navegadores de escritorio y moviles sin sobrecarga de CSS.
- **Mapas:** Leaflet / OpenStreetMap para la gestion de poligonos georreferenciados.
- **Hardware IoT:** ESP32 (NodeMCU / DevKit v1) programado en C++ (Arduino Framework) transmitiendo via HTTP POST / JSON.
- **Suite de Pruebas:** Jest, Supertest y React Testing Library.

---

## 2. DISENO DE BASE DE DATOS (POSTGRESQL 16 + POSTGIS)

Ejecutar el siguiente script DDL para inicializar la base de datos relacional con aislamiento logico por esquema (patron multiinquilino), extension geoespacial y trazabilidad de eventos.

```sql
-- Habilitar extension espacial
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Inquilinos (Multi-tenant)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios y Roles (RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_ADMIN', 'ROLE_QA_INSP', 'ROLE_FIELD_OP', 'ROLE_AUDITOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fincas y Parcelas Georreferenciadas
CREATE TABLE plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(80) NOT NULL,
    area_hectares NUMERIC(8,2) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lotes Productivos
CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE RESTRICT,
    batch_code VARCHAR(60) UNIQUE NOT NULL,
    qr_payload VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'EN_CRECIMIENTO' CHECK (status IN ('EN_CRECIMIENTO', 'BLOQUEADO_CARENCIA', 'LIBERADO_COSECHA', 'COSECHADO', 'CERRADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Registro de Insumos Fitosanitarios
CREATE TABLE chemical_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    product_name VARCHAR(120) NOT NULL,
    active_ingredient VARCHAR(120) NOT NULL,
    application_date TIMESTAMP WITH TIME ZONE NOT NULL,
    withholding_period_days INT NOT NULL, -- Dias de carencia
    safe_harvest_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Fecha minima para cosechar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Eventos Productivos y Telemetria (Bitacora)
CREATE TABLE productive_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    device_id VARCHAR(50) DEFAULT 'WEB_CONSOLE',
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('SIEMBRA', 'RIEGO', 'FERTILIZACION', 'TELEMETRIA_IOT', 'COSECHA')),
    soil_moisture NUMERIC(5,2), -- % Humedad para sensores
    temperature NUMERIC(5,2),   -- °C para sensores
    notes TEXT,
    coordinates GEOMETRY(Point, 4326),
    evidence_hash VARCHAR(64), -- SHA-256 de evidencia para auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Puntos de Control y Auditoria
CREATE TABLE quality_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    inspector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    standard_name VARCHAR(50) NOT NULL CHECK (standard_name IN ('GLOBALGAP', 'USDA_ORGANIC')),
    compliance_score NUMERIC(5,2) NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

3. ARQUITECTURA DEL BACKEND (API REST EN TYPESCRIPT)
Reglas de Diseno y Codigo Limpio

    Separacion de Responsabilidades: Carpetas por dominio (auth, plots, batches, telemetry, audits). Capas: Controller -> Service -> Repository.

    Sin Acoplamiento Directo: El servicio procesa las reglas de negocio verificables (RN-01 a RN-06); el controlador solo valida schemas HTTP y responde codigos de estado estandar.

    Manejo Centralizado de Errores: Filtro de excepciones que retorna un JSON estandar con { statusCode, message, timestamp }.

Implementacion Central de Reglas de Negocio (Service Layer)
TypeScript

// src/services/batch.service.ts
import { Pool } from 'pg';

export class BatchService {
    constructor(private db: Pool) {}

    // RN-01: Validacion del periodo de carencia antes de cosechar
    public async canHarvestBatch(batchId: string, harvestDate: Date): Promise<{ allowed: boolean; reason?: string }> {
        const query = `
            SELECT product_name, safe_harvest_date 
            FROM chemical_applications 
            WHERE batch_id = $1 
            ORDER BY safe_harvest_date DESC 
            LIMIT 1;
        `;
        const result = await this.db.query(query, [batchId]);

        if (result.rows.length > 0) {
            const lastApplication = result.rows[0];
            const safeDate = new Date(lastApplication.safe_harvest_date);
            if (harvestDate < safeDate) {
                return {
                    allowed: false,
                    reason: `Bloqueo RN-01: Periodo de carencia activo para el insumo ${lastApplication.product_name}. Cosecha no permitida antes de ${safeDate.toISOString()}`
                };
            }
        }
        return { allowed: true };
    }

    // Resolucion de expediente mediante codigo QR (RN-05: <= 1.5s)
    public async getBatchDossierByQR(qrCode: string, tenantId: string) {
        const query = `
            SELECT 
                b.id AS batch_id,
                b.batch_code,
                b.status,
                p.name AS plot_name,
                p.crop_type,
                ST_AsGeoJSON(p.boundary) AS boundary_geojson,
                COALESCE(json_agg(DISTINCT e.*) FILTER (WHERE e.id IS NOT NULL), '[]') AS events,
                COALESCE(json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL), '[]') AS chemicals,
                COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') AS audits
            FROM production_batches b
            INNER JOIN plots p ON b.plot_id = p.id
            LEFT JOIN productive_events e ON b.id = e.batch_id
            LEFT JOIN chemical_applications c ON b.id = c.batch_id
            LEFT JOIN quality_audits a ON b.id = a.batch_id
            WHERE b.qr_payload = $1 AND b.tenant_id = $2
            GROUP BY b.id, p.id;
        `;
        const result = await this.db.query(query, [qrCode, tenantId]);
        if (result.rows.length === 0) {
            throw new Error('Lote o expediente no encontrado.');
        }
        return result.rows[0];
    }
}

Endpoints Minimos Obligatorios

    POST /api/v1/auth/login -> Autenticacion JWT con rol asignado.

    GET /api/v1/plots -> Obtiene poligonos de parcelas en formato GeoJSON.

    POST /api/v1/plots -> Registra nueva parcela con validacion topologica PostGIS.

    GET /api/v1/batches/:qrPayload/dossier -> Trae expediente completo trazable por QR.

    POST /api/v1/batches/:id/harvest -> Intenta registrar cosecha evaluando RN-01.

    POST /api/v1/iot/telemetry -> Recibe lecturas de humedad y temperatura del sensor ESP32.

4. FRONTEND RESPONSIVE (REACT 18 + TYPESCRIPT + BOOTSTRAP 5)
Arquitectura de la SPA Web

    Diseno basado en componentes limpios y reutilizables.

    Sin librerias pesadas de estilos: integracion con Bootstrap 5 via CDN o npm para renderizado responsivo movil/desktop.

    Integracion de Leaflet para visualizacion interactiva de fincas y estados de riego.

Vista Principal: Expediente de Lote y Control de Riego
TypeScript

// src/components/BatchDossierView.tsx
import React, { useState, useEffect } from 'react';

interface BatchData {
    batch_code: string;
    crop_type: string;
    status: string;
    plot_name: string;
    events: Array<{ event_type: string; soil_moisture?: number; temperature?: number; created_at: string }>;
}

export const BatchDossierView: React.FC<{ qrCode: string }> = ({ qrCode }) => {
    const [batch, setBatch] = useState<BatchData null |>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/v1/batches/${qrCode}/dossier`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => res.json())
        .then(data => {
            setBatch(data);
            setLoading(false);
        })
        .catch(() => {
            setAlertMessage('Error al resolver expediente por codigo QR.');
            setLoading(false);
        });
    }, [qrCode]);

    if (loading) return <div className="text-center p-4"><div className="spinner-border text-success"></div></div>;
    if (!batch) return <div className="alert alert-warning m-3">No se encontro informacion del lote.</div>;

    return (
        <div className="container-fluid p-3">
            {alertMessage && <div className="alert alert-danger">{alertMessage}</div>}
            
            <div className="card shadow-sm mb-3">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h5 className="m-0">Lote: {batch.batch_code}</h5>
                    <span className="badge bg-light text-dark">{batch.status}</span>
                </div>
                <div className="card-body">
                    <div className="row g-2">
                        <div className="col-12 col-md-6">
                            <p><strong>Parcela:</strong> {batch.plot_name}</p>
                            <p><strong>Cultivo:</strong> {batch.crop_type}</p>
                        </div>
                        <div className="col-12 col-md-6 text-md-end">
                            <button className="btn btn-outline-danger btn-sm w-100 w-md-auto mb-2" onClick={() => alert('Accion: Forzar Riego Manual')}>
                                Ejecutar Riego de Emergencia
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header bg-secondary text-white">
                    <h6 className="m-0">Telemetria Reciente y Eventos</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped table-hover m-0">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo de Evento</th>
                                    <th>Humedad Suelo</th>
                                    <th>Temperatura</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batch.events.map((evt, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(evt.created_at).toLocaleString()}</td>
                                        <td>{evt.event_type}</td>
                                        <td>{evt.soil_moisture ? `${evt.soil_moisture}%` : 'N/A'}</td>
                                        <td>{evt.temperature ? `${evt.temperature}°C` : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

5. HARDWARE IOT: FIRMWARE PARA ESP32 (CONTROL DE RIEGO Y TELEMETRIA)

Este codigo permite programar un microcontrolador ESP32 para leer un sensor de humedad de suelo capacitivo/resistivo y enviar las lecturas a la API de AgroChain para registrar la telemetria.
Diagrama de Conexiones Fisicas

    ESP32 Pin 34 (ADC1): Salida Analogica del Sensor de Humedad de Suelo.

    ESP32 Pin 23 (GPIO): Entrada de Control del Modulo de Rele (Electrovalvula de Riego).

    VCC: 3.3V o 5V segun especificaciones del sensor.

    GND: Tierra comun.

Codigo Fuente C++ (Arduino IDE / PlatformIO)
C++

#include <WiFi.h>
#include <HTTPClient.h>

// 1. Configuracion de Red y Servidor
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_PASSWORD";
const char* serverEndpoint = "[http://192.168.1.50:3000/api/v1/iot/telemetry](http://192.168.1.50:3000/api/v1/iot/telemetry)";

// 2. Pines de Hardware
const int SENSOR_PIN = 34; // Pin analogico de humedad
const int RELAY_PIN = 23;  // Pin digital que conmuta la electrovalvula

// 3. Umbrales de Riego
const int UMBRAL_SECO = 2800; // Calibracion ADC (0 = Mojado, 4095 = Aire seco)
const char* BATCH_ID = "c7a8b61c-8e34-4b51-9104-58e1d2f95431";

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Valvula cerrada inicialmente

  WiFi.begin(ssid, password);
  Serial.print("Conectando al WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado con exito. IP asignada: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int rawValue = analogRead(SENSOR_PIN);
    // Mapeo simple a porcentaje de 0% a 100%
    float moisturePercentage = map(rawValue, 4095, 1200, 0, 100);
    if (moisturePercentage < 0) moisturePercentage = 0;
    if (moisturePercentage > 100) moisturePercentage = 100;

    // Logica Local de Seguridad (Tolerancia a Fallos / Fail-safe)
    if (rawValue > UMBRAL_SECO) {
      digitalWrite(RELAY_PIN, HIGH); // Abrir valvula por resequedad
      Serial.println("Alerta: Suelo seco. Riego Activado.");
    } else {
      digitalWrite(RELAY_PIN, LOW); // Cerrar valvula
      Serial.println("Humedad Optima. Riego Apagado.");
    }

    // Transmitir Telemetria al Backend
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"batch_id\":\"" + String(BATCH_ID) + 
                         "\",\"device_id\":\"ESP32_SECTOR_01\"," +
                         "\"event_type\":\"TELEMETRIA_IOT\"," +
                         "\"soil_moisture\":" + String(moisturePercentage, 2) + "," +
                         "\"temperature\":24.5}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("Respuesta HTTP del Backend: ");
    Serial.println(httpResponseCode);
    
    http.end();
  }

  // Intervalo de medicion: cada 30 segundos para demostracion
  delay(30000);
}

6. SUITE DE PRUEBAS AUTOMATIZADAS (ISO/IEC/IEEE 29119 E ISO/IEC 25010)

Para que el grupo evaluador externo ejecute las pruebas de forma reproducible, se definen los casos que comprueban la calidad del producto.

Prueba Unitaria: Evaluacion de Regla de Carencia (RN-01)


TypeScript

// tests/unit/batchRules.test.ts
import { BatchService } from '../../src/services/batch.service';

describe('ISO 25010 - Adecuacion Funcional: Verificacion de Regla RN-01', () => {
    let mockDb: any;
    let batchService: BatchService;

    beforeEach(() => {
        mockDb = { query: jest.fn() };
        batchService = new BatchService(mockDb);
    });

    it('Debe BLOQUEAR la cosecha si la fecha actual esta dentro del periodo de carencia', async () => {
        const mockHarvestDate = new Date('2026-09-20T00:00:00Z');
        const safeHarvestDate = new Date('2026-09-25T00:00:00Z'); // Posterior

        mockDb.query.mockResolvedValue({
            rows: [{ product_name: 'Fungicida Clorotalonil', safe_harvest_date: safeHarvestDate }]
        });

        const result = await batchService.canHarvestBatch('batch-123', mockHarvestDate);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Bloqueo RN-01');
    });

    it('Debe PERMITIR la cosecha si se ha superado el periodo de carencia', async () => {
        const mockHarvestDate = new Date('2026-09-26T00:00:00Z');
        const safeHarvestDate = new Date('2026-09-25T00:00:00Z'); // Anterior

        mockDb.query.mockResolvedValue({
            rows: [{ product_name: 'Fungicida Clorotalonil', safe_harvest_date: safeHarvestDate }]
        });

        const result = await batchService.canHarvestBatch('batch-123', mockHarvestDate);

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
    });
});

Prueba de Integracion: Endpoint de Telemetria IoT
TypeScript

// tests/integration/iotTelemetry.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('ISO 25010 - Fiabilidad e Integracion de Datos IoT', () => {
    it('POST /api/v1/iot/telemetry debe registrar la lectura y responder HTTP 201', async () => {
        const payload = {
            batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
            device_id: 'ESP32_SECTOR_01',
            event_type: 'TELEMETRIA_IOT',
            soil_moisture: 45.8,
            temperature: 23.4
        };

        const response = await request(app)
            .post('/api/v1/iot/telemetry')
            .send(payload)
            .set('Accept', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.soil_moisture).toBe(45.8);
    });
});

7. INSTRUCCIONES DE DESPLIEGUE Y EVALUACION EXTERNA

Para que cualquier evaluador ejecute y valide el sistema completo en su estacion de trabajo:

    Levantar Entorno de Persistencia (PostgreSQL + PostGIS):
    Bash

    docker run -d --name agrochain-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=agrochain postgis/postgis:16-3.4

    Ejecutar Migraciones DDL:
    Conectar cualquier cliente SQL (DBeaver, pgAdmin, psql) a localhost:5432 y ejecutar el script del Apartado 2.

    Instalacion y Pruebas del Backend:
    Bash

    cd backend
    npm install
    npm test -- --coverage --testResultsProcessor="jest-junit"
    npm run start:dev

    Criterio de Aceptacion: La cobertura de pruebas debe ser mayor o igual al 85%.

    Instalacion y Despliegue del Frontend Web:
    Bash

    cd frontend
    npm install
    npm run dev

    Acceso: Abrir http://localhost:5173 en el navegador y probar tanto en vista de escritorio como en modo simulacion movil.

    Comprobacion de Telemetria de Sensores:
    Si no se dispone del microcontrolador fisico ESP32 durante la evaluacion, simular el envio mediante curl:
    Bash

    curl -X POST http://localhost:3000/api/v1/iot/telemetry \
      -H "Content-Type: application/json" \
      -d '{"batch_id":"c7a8b61c-8e34-4b51-9104-58e1d2f95431","device_id":"TEST_CLI","event_type":"TELEMETRIA_IOT","soil_moisture":32.5,"temperature":26.0}'

    La fila debera reflejarse de inmediato en la tabla de telemetria del portal web.