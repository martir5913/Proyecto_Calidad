-- AGROCHAIN ERP: DDL DEFINITIVO (POSTGRESQL 16 + POSTGIS)
-- Soporta aislamiento multi-inquilino, extension espacial, reglas de negocio e integridad referencial

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Inquilinos (Multi-tenant)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    country VARCHAR(60) DEFAULT 'Guatemala',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_ADMIN', 'ROLE_QA_INSP', 'ROLE_FIELD_OP', 'ROLE_AUDITOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fincas y Parcelas Georreferenciadas
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(80) NOT NULL,
    area_hectares NUMERIC(8,2) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    irrigation_system VARCHAR(50) DEFAULT 'GOTEO_AUTOMATIZADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lotes Productivos
CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE RESTRICT,
    batch_code VARCHAR(60) UNIQUE NOT NULL,
    qr_payload VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'EN_CRECIMIENTO' CHECK (status IN ('EN_CRECIMIENTO', 'BLOQUEADO_CARENCIA', 'LIBERADO_COSECHA', 'COSECHADO', 'CERRADO')),
    planting_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estimated_harvest_date TIMESTAMP WITH TIME ZONE,
    actual_harvest_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Registro de Insumos Fitosanitarios
CREATE TABLE IF NOT EXISTS chemical_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    product_name VARCHAR(120) NOT NULL,
    active_ingredient VARCHAR(120) NOT NULL,
    dosage VARCHAR(80) NOT NULL,
    application_date TIMESTAMP WITH TIME ZONE NOT NULL,
    withholding_period_days INT NOT NULL, -- Días de carencia
    safe_harvest_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Fecha mínima segura para cosechar
    applied_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Eventos Productivos y Telemetria (Bitacora de Riego y Sensores)
CREATE TABLE IF NOT EXISTS productive_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    device_id VARCHAR(50) DEFAULT 'WEB_CONSOLE',
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('SIEMBRA', 'RIEGO', 'FERTILIZACION', 'TELEMETRIA_IOT', 'COSECHA', 'INSPECCION')),
    soil_moisture NUMERIC(5,2), -- % Humedad de suelo (0 - 100%)
    temperature NUMERIC(5,2),   -- °C Ambiente / Suelo
    valve_status VARCHAR(20) DEFAULT 'OFF' CHECK (valve_status IN ('ON', 'OFF', 'AUTO')),
    notes TEXT,
    coordinates GEOMETRY(Point, 4326),
    evidence_hash VARCHAR(64), -- SHA-256 de evidencia para auditoría e integridad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Puntos de Control y Auditoria de Calidad
CREATE TABLE IF NOT EXISTS quality_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    inspector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    standard_name VARCHAR(50) NOT NULL CHECK (standard_name IN ('GLOBALGAP', 'USDA_ORGANIC')),
    compliance_score NUMERIC(5,2) NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices para optimizacion espacial y de consulta
CREATE INDEX IF NOT EXISTS idx_plots_boundary ON plots USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_batches_qr ON production_batches(qr_payload);
CREATE INDEX IF NOT EXISTS idx_telemetry_batch ON productive_events(batch_id, created_at DESC);
