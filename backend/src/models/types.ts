export type UserRole = 'ROLE_ADMIN' | 'ROLE_QA_INSP' | 'ROLE_FIELD_OP' | 'ROLE_AUDITOR';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  created_at?: Date;
}

export interface User {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at?: Date;
}

export interface Plot {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  crop_type: string;
  area_hectares: number;
  boundary?: any;
  boundary_geojson?: string;
  irrigation_system: string;
  created_at?: Date;
}

export type BatchStatus = 'EN_CRECIMIENTO' | 'BLOQUEADO_CARENCIA' | 'LIBERADO_COSECHA' | 'COSECHADO' | 'CERRADO';

export interface ProductionBatch {
  id: string;
  tenant_id: string;
  plot_id: string;
  batch_code: string;
  qr_payload: string;
  status: BatchStatus;
  planting_date?: Date;
  estimated_harvest_date?: Date;
  actual_harvest_date?: Date;
  created_at?: Date;
}

export interface ChemicalApplication {
  id: string;
  batch_id: string;
  product_name: string;
  active_ingredient: string;
  dosage: string;
  application_date: Date;
  withholding_period_days: number;
  safe_harvest_date: Date;
  applied_by?: string;
  created_at?: Date;
}

export type EventType = 'SIEMBRA' | 'RIEGO' | 'FERTILIZACION' | 'TELEMETRIA_IOT' | 'COSECHA' | 'INSPECCION';
export type ValveStatus = 'ON' | 'OFF' | 'AUTO';

export interface ProductiveEvent {
  id?: string;
  batch_id: string;
  device_id: string;
  event_type: EventType;
  soil_moisture?: number;
  temperature?: number;
  valve_status?: ValveStatus;
  notes?: string;
  coordinates?: any;
  evidence_hash?: string;
  created_at?: Date;
}

export interface QualityAudit {
  id?: string;
  batch_id: string;
  inspector_id: string;
  standard_name: 'GLOBALGAP' | 'USDA_ORGANIC';
  compliance_score: number;
  is_compliant: boolean;
  observations?: string;
  created_at?: Date;
}

export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  fullName: string;
}
