import React from 'react';
import { Plot, BatchDossier, TelemetryEvent, User } from '../types';
import { MapPin, QrCode, Droplets, ShieldAlert, CheckCircle2, Cpu, ArrowUpRight, Zap, Layers, Sparkles, Lock } from 'lucide-react';

interface DashboardViewProps {
  plots: Plot[];
  batchDossier: BatchDossier | null;
  events: TelemetryEvent[];
  onNavigate: (tab: string) => void;
  onTriggerIrrigation: () => void;
  currentUser?: User;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plots,
  batchDossier,
  events,
  onNavigate,
  onTriggerIrrigation,
  currentUser
}) => {
  const totalHectares = plots.reduce((acc, p) => acc + p.area_hectares, 0);
  const latestEvent = events.length ? events[0] : null;
  const currentMoisture = latestEvent?.soil_moisture ?? 34.5;
  const currentTemp = latestEvent?.temperature ?? 24.5;
  const isDry = currentMoisture < 25.0;
  const valveStatus = isDry ? 'ON' : (latestEvent?.valve_status ?? 'OFF');

  const canOperateValve = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_FIELD_OP';

  return (
    <div className="container-fluid px-4 py-4 my-2">
      {/* 1. Hero Card Superior (Sin línea de color lateral) */}
      <div className="card-premium p-4 mb-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="pill-badge pill-badge-success">
                <Sparkles size={13} /> Finca Las Victorias
              </span>
              <span className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>Sacatepéquez, Guatemala</span>
            </div>
            <h3 className="font-heading text-dark mb-1 fw-bold fs-3">Centro de Monitoreo Agronómico y Trazabilidad</h3>
            <p className="text-secondary mb-0" style={{ fontSize: '0.92rem' }}>
              Plataforma digital bajo estándares <strong className="text-dark">ISO/IEC 25010</strong> e <strong className="text-dark">ISO/IEC/IEEE 29119</strong> para certificación agroexportadora.
            </p>
          </div>

          <div className="d-flex gap-2.5 flex-wrap">
            <button 
              type="button"
              className="btn-action-primary"
              onClick={() => onNavigate('batches')}
            >
              <QrCode size={18} />
              <span>Verificar Lote QR</span>
            </button>
            <button 
              type="button"
              className="btn-action-outline"
              onClick={() => onNavigate('telemetry')}
            >
              <Cpu size={18} />
              <span>Control IoT de Riego</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Banner de Alerta Fitosanitaria (Regla RN-01) (Sin línea de color lateral) */}
      <div className="alert-carencia-banner mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-start gap-3">
          <div className="p-2.5 rounded-3 text-white flex-shrink-0 mt-0.5" style={{ background: '#e11d48' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className="alert-carencia-title fs-6">Bloqueo Activo por Período de Carencia (Regla RN-01)</span>
              <span className="badge bg-danger text-white rounded-pill px-2.5 py-1" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                RESTRICCIÓN FITOSANITARIA
              </span>
            </div>
            <p className="alert-carencia-desc">
              Lote <strong className="font-mono text-dark bg-white px-1.5 py-0.5 rounded">BATCH-2026-AVO-001 (Aguacate Hass)</strong>: Aplicación reciente de <em>Fungicida Clorotalonil</em>. Cosecha bloqueada automáticamente durante <strong>12 días restantes</strong> para garantizar inocuidad de exportación.
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="btn btn-danger btn-sm text-nowrap fw-bold px-3.5 py-2.5 rounded-3 shadow-sm flex-shrink-0"
          onClick={() => onNavigate('batches')}
        >
          Verificar Expediente
        </button>
      </div>

      {/* 3. Grid de Métricas Principales (KPIs) */}
      <div className="row g-4 mb-4">
        {/* KPI 1: Área */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="metric-title">Área Monitoreada</span>
                <div className="p-2.5 rounded-3" style={{ background: '#ecfdf5', color: '#047857' }}>
                  <MapPin size={20} />
                </div>
              </div>
              <div className="metric-value">{totalHectares.toFixed(2)}<span className="metric-unit">Ha</span></div>
            </div>
            <div className="metric-subtitle">
              <Layers size={15} className="text-success" />
              <span>2 Parcelas Geoespaciales PostGIS</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Humedad */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="metric-title">Humedad de Suelo</span>
                <div className="p-2.5 rounded-3" style={{ background: isDry ? '#fee2e2' : '#e0f2fe', color: isDry ? '#dc2626' : '#0284c7' }}>
                  <Droplets size={20} />
                </div>
              </div>
              <div className="metric-value">{currentMoisture.toFixed(1)}<span className="metric-unit">%</span></div>
            </div>
            <div>
              <span className={`pill-badge ${isDry ? 'pill-badge-danger' : 'pill-badge-success'}`}>
                {isDry ? 'Suelo Seco (<25%) — Riego Activo' : 'Rango de Hidratación Óptimo'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Válvula */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="metric-title">Electroválvula Sector 01</span>
                <div className="p-2.5 rounded-3" style={{ background: valveStatus === 'ON' ? '#fef3c7' : '#f1f5f9', color: valveStatus === 'ON' ? '#d97706' : '#64748b' }}>
                  <Zap size={20} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="metric-value mb-0">{valveStatus}</span>
                <span className={`pill-badge ${valveStatus === 'ON' ? 'pill-badge-warning' : 'pill-badge-neutral'}`}>
                  {valveStatus === 'ON' ? 'REGANDO' : 'EN ESPERA'}
                </span>
              </div>
            </div>
            <div className="text-muted small fw-medium">
              Control Autónomo Fail-safe ESP32
            </div>
          </div>
        </div>

        {/* KPI 4: GLOBALGAP */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="metric-title">Conformidad GLOBALG.A.P.</span>
                <div className="p-2.5 rounded-3" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="metric-value text-emerald-800" style={{ color: '#047857' }}>96.5<span className="metric-unit">%</span></div>
            </div>
            <div>
              <span className="pill-badge pill-badge-success">Dictamen Conforme Aprobado</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fila Central: Tabla de Parcelas y Acciones de Campo */}
      <div className="row g-4">
        {/* Parcelas */}
        <div className="col-12 col-lg-7">
          <div className="card-premium p-0 overflow-hidden h-100">
            <div className="card-header-clean d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={19} className="text-success" />
                <h5 className="font-heading mb-0 text-dark fw-bold fs-6">Parcelas Productivas Registradas</h5>
              </div>
              <button 
                type="button"
                className="btn btn-link btn-sm text-decoration-none fw-semibold p-0 d-flex align-items-center gap-1 text-success"
                onClick={() => onNavigate('map')}
              >
                <span>Ver Mapa Interactivo</span>
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="ps-4">Código</th>
                      <th>Sector / Nombre</th>
                      <th>Cultivo</th>
                      <th>Área</th>
                      <th className="pe-4">Sistema de Riego</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plots.map((plot) => (
                      <tr 
                        key={plot.id} 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => onNavigate('map')}
                      >
                        <td className="ps-4 font-mono fw-bold text-primary">{plot.code}</td>
                        <td className="fw-semibold text-dark">{plot.name}</td>
                        <td>
                          <span className="pill-badge pill-badge-info">
                            {plot.crop_type}
                          </span>
                        </td>
                        <td className="fw-bold text-dark">{plot.area_hectares} Ha</td>
                        <td className="pe-4">
                          <span className="pill-badge pill-badge-success">
                            {plot.irrigation_system.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones de Campo */}
        <div className="col-12 col-lg-5">
          <div className="card-premium h-100 d-flex flex-column justify-content-between p-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2.5">
                <Cpu size={19} className="text-primary" />
                <h5 className="font-heading mb-0 text-dark fw-bold fs-6">Panel de Acciones Rápidas de Campo</h5>
              </div>

              <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
                Instrumentación para pruebas de evaluación universitaria, verificación de actuadores y contingencias:
              </p>

              <div className="p-3.5 rounded-3 mb-4 border bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-light-subtle">
                  <span className="fw-bold text-dark font-heading" style={{ fontSize: '0.85rem' }}>
                    ESP32 Sector 01 (Telemetría)
                  </span>
                  <span className="font-mono badge bg-white text-secondary border px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
                    {latestEvent ? new Date(latestEvent.created_at).toLocaleTimeString() : 'En Vivo'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span className="fw-semibold text-dark font-heading" style={{ fontSize: '0.92rem' }}>
                    Humedad: <strong className={isDry ? 'text-danger' : 'text-success'}>{currentMoisture.toFixed(1)}%</strong> &bull; Temp: <strong>{currentTemp.toFixed(1)}°C</strong>
                  </span>
                  <span className={`pill-badge ${isDry ? 'pill-badge-danger' : 'pill-badge-success'}`}>
                    {valveStatus === 'ON' ? 'Válvula ON' : 'Válvula OFF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              {canOperateValve ? (
                <button 
                  type="button"
                  className="btn-action-danger py-2.5 w-100"
                  onClick={onTriggerIrrigation}
                >
                  <Droplets size={18} />
                  <span>Activar Riego Manual de Emergencia</span>
                </button>
              ) : (
                <button 
                  type="button"
                  className="btn btn-secondary py-2.5 w-100 d-flex align-items-center justify-content-center gap-2 disabled opacity-75"
                  disabled
                  title="Acceso restringido: Solo Operadores y Administradores pueden conmutar la electroválvula"
                >
                  <Lock size={16} />
                  <span>Riego Restringido para este Rol</span>
                </button>
              )}

              <button 
                type="button"
                className="btn btn-outline-primary fw-semibold d-flex align-items-center justify-content-center gap-2 py-2.5 rounded-3"
                onClick={() => onNavigate('telemetry')}
              >
                <Cpu size={18} />
                <span>Abrir Monitor de Telemetría ESP32</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
