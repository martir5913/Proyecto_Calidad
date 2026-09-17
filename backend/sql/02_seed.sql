-- AGROCHAIN ERP: SEED DE DATOS REALISTAS PARA DEMOSTRACION Y EVALUACION

-- 1. Inquilino Principal
INSERT INTO tenants (id, name, subdomain, country)
VALUES ('11111111-1111-1111-1111-111111111111', 'AgroTrace Tech / Finca Las Victorias', 'lasvictorias', 'Guatemala')
ON CONFLICT (id) DO NOTHING;

-- 2. Usuarios con roles RBAC (Contraseña predeterminada para todos: 'Password123!')
-- Hash generado para 'Password123!' con bcrypt ($2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.)
INSERT INTO users (id, tenant_id, full_name, email, password_hash, role)
VALUES 
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Ing. Fredy Martir', 'admin@agrochain.gt', '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.', 'ROLE_ADMIN'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Lic. Daniel Maldonado', 'qa@agrochain.gt', '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.', 'ROLE_QA_INSP'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Agr. Esdras Ajanel', 'campo@agrochain.gt', '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.', 'ROLE_FIELD_OP'),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Auditor GlobalGAP', 'auditor@certificadora.org', '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.', 'ROLE_AUDITOR')
ON CONFLICT (id) DO NOTHING;

-- 3. Parcelas con poligonos PostGIS en Sacatepequez / Antigua Guatemala
INSERT INTO plots (id, tenant_id, code, name, crop_type, area_hectares, boundary, irrigation_system)
VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'PARC-01-AVO',
    'Sector Los Volcanes - Aguacate Hass',
    'Aguacate Hass de Exportacion',
    12.50,
    ST_GeomFromText('POLYGON((-90.7385 14.5580, -90.7320 14.5580, -90.7320 14.5520, -90.7385 14.5520, -90.7385 14.5580))', 4326),
    'GOTEO_AUTOMATIZADO_ESP32'
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'PARC-02-COF',
    'Sector El Mirador - Cafe Bourbon',
    'Cafe Arabica Especial',
    18.75,
    ST_GeomFromText('POLYGON((-90.7450 14.5650, -90.7390 14.5650, -90.7390 14.5590, -90.7450 14.5590, -90.7450 14.5650))', 4326),
    'ASPERSION_SECTORIZADA'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Lotes Productivos
-- Lote 1: Activo con Bloqueo de Carencia (demuestra regla RN-01 en evaluacion)
-- Lote 2: Listo y Liberado para Cosecha
INSERT INTO production_batches (id, tenant_id, plot_id, batch_code, qr_payload, status, planting_date, estimated_harvest_date)
VALUES 
(
    'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'BATCH-2026-AVO-001',
    'QR-AGROCHAIN-AVO-2026-001',
    'BLOQUEADO_CARENCIA',
    NOW() - INTERVAL '90 days',
    NOW() + INTERVAL '15 days'
),
(
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333332',
    'BATCH-2026-COF-002',
    'QR-AGROCHAIN-COF-2026-002',
    'LIBERADO_COSECHA',
    NOW() - INTERVAL '180 days',
    NOW() + INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Aplicaciones Fitosanitarias
-- En BATCH 1: Se aplico Fungicida hace 2 dias con periodo de carencia de 14 dias (Faltan 12 dias -> BLOQUEA COSECHA RN-01)
-- En BATCH 2: Se aplico Bioinsumo organico hace 25 dias con carencia de 7 dias (Ya paso -> PERMITE COSECHA)
INSERT INTO chemical_applications (id, batch_id, product_name, active_ingredient, dosage, application_date, withholding_period_days, safe_harvest_date, applied_by)
VALUES 
(
    '55555555-5555-5555-5555-555555555551',
    'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
    'Fungicida Clorotalonil 720 SC',
    'Clorotalonil',
    '2.0 L/Ha',
    NOW() - INTERVAL '2 days',
    14,
    NOW() + INTERVAL '12 days',
    'Esdras Ajanel (Operador Campo)'
),
(
    '55555555-5555-5555-5555-555555555552',
    '44444444-4444-4444-4444-444444444442',
    'Extracto de Neem Orgánico BioProtect',
    'Azadiractina',
    '1.5 L/Ha',
    NOW() - INTERVAL '25 days',
    7,
    NOW() - INTERVAL '18 days',
    'Esdras Ajanel (Operador Campo)'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Eventos y Telemetria IoT
INSERT INTO productive_events (id, batch_id, device_id, event_type, soil_moisture, temperature, valve_status, notes, coordinates, evidence_hash, created_at)
VALUES 
(
    '66666666-6666-6666-6666-666666666661',
    'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
    'ESP32_SECTOR_01',
    'TELEMETRIA_IOT',
    34.50,
    23.80,
    'OFF',
    'Lectura periodica automatica sensor suelo',
    ST_GeomFromText('POINT(-90.7350 14.5550)', 4326),
    '8f4a1c6e9d2b5a7f3e1c9d8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f',
    NOW() - INTERVAL '15 minutes'
),
(
    '66666666-6666-6666-6666-666666666662',
    'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
    'ESP32_SECTOR_01',
    'RIEGO',
    21.20,
    26.50,
    'ON',
    'Activacion automatica por umbral de sequedad (<25%)',
    ST_GeomFromText('POINT(-90.7350 14.5550)', 4326),
    'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    NOW() - INTERVAL '5 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Auditorias de Calidad
INSERT INTO quality_audits (id, batch_id, inspector_id, standard_name, compliance_score, is_compliant, observations)
VALUES 
(
    '77777777-7777-7777-7777-777777777771',
    'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
    '22222222-2222-2222-2222-222222222222',
    'GLOBALGAP',
    96.50,
    TRUE,
    'Lote en cumplimiento con protocolo de manejo integrado de plagas y bitácoras georreferenciadas.'
)
ON CONFLICT (id) DO NOTHING;
