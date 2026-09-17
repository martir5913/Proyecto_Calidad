export interface Plot {
  id: string;
  code: string;
  name: string;
  crop_type: string;
  area_hectares: number;
  irrigation_system: string;
  boundary_geojson?: string;
}

export interface ChemicalApplication {
  id: string;
  product_name: string;
  active_ingredient: string;
  dosage: string;
  application_date: string;
  withholding_period_days: number;
  safe_harvest_date: string;
  applied_by?: string;
}

export interface TelemetryEvent {
  id?: string;
  batch_id: string;
  device_id: string;
  event_type: string;
  soil_moisture?: number;
  temperature?: number;
  valve_status?: 'ON' | 'OFF' | 'AUTO';
  notes?: string;
  evidence_hash?: string;
  created_at: string;
  batch_code?: string;
}

export interface QualityAudit {
  id: string;
  batch_id: string;
  batch_code?: string;
  inspector_name?: string;
  standard_name: 'GLOBALGAP' | 'USDA_ORGANIC';
  compliance_score: number;
  is_compliant: boolean;
  observations?: string;
  created_at: string;
}

export interface BatchDossier {
  batch_id: string;
  batch_code: string;
  qr_payload: string;
  status: string;
  planting_date: string;
  estimated_harvest_date: string;
  actual_harvest_date?: string;
  plot_id: string;
  plot_name: string;
  crop_type: string;
  area_hectares: number;
  irrigation_system: string;
  boundary_geojson?: string;
  chemicals: ChemicalApplication[];
  events: TelemetryEvent[];
  audits: QualityAudit[];
  _resolution_time_ms?: number;
  _compliance_rn05?: boolean;
}

export type UserRole = 'ROLE_ADMIN' | 'ROLE_FIELD_OP' | 'ROLE_QA_INSP' | 'ROLE_AUDITOR';

export interface User {
  id?: string;
  tenant_id?: string;
  full_name: string;
  email: string;
  role: UserRole;
}

