import React, { useState } from 'react';
import { TelemetryEvent, User } from '../types';
import { ApiService } from '../services/api';
import { Cpu, Droplets, Thermometer, Play, RefreshCw, ShieldCheck, Zap, Radio, Sparkles, Activity, Lock } from 'lucide-react';

interface TelemetryMonitorViewProps {
  events: TelemetryEvent[];
  onRefresh: () => void;
  currentUser?: User;
}

export const TelemetryMonitorView: React.FC<TelemetryMonitorViewProps> = ({
  events,
  onRefresh,
  currentUser
}) => {
  const [testMoisture, setTestMoisture] = useState<number>(18.5);
  const [testTemp, setTestTemp] = useState<number>(24.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const canOperateActuator = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_FIELD_OP';

  const latestEvent = events.length ? events[0] : null;
  const currentMoisture = latestEvent?.soil_moisture ?? 34.5;
  const currentTemp = latestEvent?.temperature ?? 24.5;
  const isDry = currentMoisture < 25.0;
  const currentValve = isDry ? 'ON' : (latestEvent?.valve_status ?? 'OFF');

  const handleSendSensorReading = async (moistureVal: number, tempVal: number) => {
    setIsSimulating(true);
    setFeedbackMsg(null);
    try {
      const res = await ApiService.sendTelemetry({
        batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
        device_id: 'ESP32_PANEL_SIMULADOR',
        soil_moisture: moistureVal,
        temperature: tempVal,
        notes: `Prueba evaluador: Humedad ${moistureVal}%`
      });

      if (res.success) {
        setFeedbackMsg(res.actionTaken || 'Lectura registrada y procesada por backend.');
        onRefresh();
      }
    } catch (e: any) {
      setFeedbackMsg(`Error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleManualIrrigation = async () => {
    setIsSimulating(true);
    try {
      const res = await ApiService.triggerManualIrrigation('c7a8b61c-8e34-4b51-9104-58e1d2f95431', 15);
      if (res.success) {
        setFeedbackMsg('Comando emitido: Electroválvula activada por 15 minutos (Riego Manual).');
        onRefresh();
      }
    } catch (e: any) {
      setFeedbackMsg(`Error al emitir comando: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      {/* Header */}
      <div className="card-premium p-4 mb-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="pill-badge pill-badge-info">
                <Cpu size={12} /> Microcontrolador ESP32 DevKit v1
              </span>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Tolerancia a Fallos Local (Fail-Safe ISO 25010)</span>
            </div>
            <h4 className="font-heading fw-bold text-dark mb-1">Núcleo de Telemetría IoT y Control de Riego Automatizado</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
              Monitoreo continuo de variables de suelo y control de electroválvula con respaldo de seguridad.
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1.5 px-3 py-2 rounded-3"
            onClick={onRefresh}
          >
            <RefreshCw size={14} />
            <span>Actualizar Telemetría</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="card-premium p-3 mb-4 d-flex align-items-center gap-2.5 shadow-sm">
          <Radio size={18} className="text-success flex-shrink-0" />
          <span style={{ fontSize: '0.88rem' }}><strong className="text-success">Respuesta del Sistema:</strong> {feedbackMsg}</span>
        </div>
      )}

      {/* Indicadores en Vivo */}
      <div className="row g-4 mb-4">
        {/* Humedad */}
        <div className="col-12 col-md-4">
          <div className="card-premium p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-inline-flex p-3 rounded-4 mb-3" style={{ background: isDry ? '#fee2e2' : '#e0f2fe', color: isDry ? '#dc2626' : '#0284c7' }}>
                <Droplets size={28} />
              </div>
              <div className="text-muted fw-semibold small text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Humedad de Suelo</div>
              <div className="metric-value text-dark mb-2">{currentMoisture.toFixed(1)} <span className="fs-5 fw-medium text-muted">%</span></div>
              
              <div className="progress mb-3 rounded-pill" style={{ height: '8px', background: '#f1f5f9' }}>
                <div 
                  className={`progress-bar rounded-pill ${isDry ? 'bg-danger' : 'bg-success'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, currentMoisture))}%` }}
                ></div>
              </div>
            </div>
            <div>
              <span className={`pill-badge ${isDry ? 'pill-badge-danger' : 'pill-badge-success'}`}>
                {isDry ? 'Alerta: Suelo Seco (<25%)' : 'Humedad Óptima (>=25%)'}
              </span>
            </div>
          </div>
        </div>

        {/* Temperatura */}
        <div className="col-12 col-md-4">
          <div className="card-premium p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-inline-flex p-3 rounded-4 mb-3" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Thermometer size={28} />
              </div>
              <div className="text-muted fw-semibold small text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Temperatura Ambiental</div>
              <div className="metric-value text-dark mb-2">{currentTemp.toFixed(1)} <span className="fs-5 fw-medium text-muted">°C</span></div>
            </div>
            <div>
              <span className="pill-badge pill-badge-info">Sensor Térmico Calibrado</span>
            </div>
          </div>
        </div>

        {/* Electroválvula */}
        <div className="col-12 col-md-4">
          <div className="card-premium p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-inline-flex p-3 rounded-4 mb-3" style={{ background: currentValve === 'ON' ? '#fef3c7' : '#f1f5f9', color: currentValve === 'ON' ? '#d97706' : '#64748b' }}>
                <Zap size={28} />
              </div>
              <div className="text-muted fw-semibold small text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Actuador Electroválvula</div>
              <div className="metric-value text-dark mb-2">{currentValve}</div>
              <div>
                <span className={`pill-badge ${currentValve === 'ON' ? 'pill-badge-warning' : 'pill-badge-info'}`}>
                  {currentValve === 'ON' ? 'Válvula Abierta (Regando)' : 'Válvula Cerrada (En Espera)'}
                </span>
              </div>
            </div>

            {canOperateActuator ? (
              <button 
                type="button"
                className="btn btn-outline-danger btn-sm fw-semibold w-100 mt-3 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1.5"
                onClick={handleManualIrrigation}
                disabled={isSimulating}
              >
                <Droplets size={15} />
                <span>Riego Manual de Emergencia</span>
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-secondary btn-sm w-100 mt-3 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1.5 disabled opacity-75"
                disabled
                title="Solo Administradores y Operadores de Campo pueden conmutar la electroválvula"
              >
                <Lock size={15} />
                <span>Riego Manual Restringido</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulador para Evaluadores */}
      <div className="card-premium p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
          <Cpu size={18} className="text-primary" />
          <h6 className="font-heading fw-bold text-dark mb-0">Simulador de Sensor ESP32 para Evaluación Externa</h6>
        </div>
        <p className="text-muted small mb-3">
          Pruebe la respuesta del sistema simulando lecturas de campo sin necesidad de hardware físico:
        </p>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-sm-4">
            <label className="form-label small fw-semibold text-dark">Simular Humedad de Suelo (%)</label>
            <input 
              type="number" 
              className="form-control rounded-3" 
              min="0" 
              max="100" 
              step="0.5"
              value={testMoisture} 
              onChange={(e) => setTestMoisture(parseFloat(e.target.value) || 0)} 
            />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label small fw-semibold text-dark">Simular Temperatura (°C)</label>
            <input 
              type="number" 
              className="form-control rounded-3" 
              min="-10" 
              max="60" 
              step="0.5"
              value={testTemp} 
              onChange={(e) => setTestTemp(parseFloat(e.target.value) || 0)} 
            />
          </div>
          <div className="col-12 col-sm-4">
            <button 
              type="button"
              className="btn-action-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
              onClick={() => handleSendSensorReading(testMoisture, testTemp)}
              disabled={isSimulating}
            >
              <Play size={16} />
              <span>Transmitir al Backend</span>
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 pt-2 border-top flex-wrap">
          <span className="small text-muted fw-semibold">Escenarios Rápidos:</span>
          <button 
            type="button"
            className="btn btn-outline-danger btn-sm rounded-3 fw-semibold"
            onClick={() => { setTestMoisture(15.0); handleSendSensorReading(15.0, 26.5); }}
          >
            Suelo Seco (15% -&gt; Abre Válvula ON)
          </button>
          <button 
            type="button"
            className="btn btn-outline-success btn-sm rounded-3 fw-semibold"
            onClick={() => { setTestMoisture(45.0); handleSendSensorReading(45.0, 23.0); }}
          >
            Suelo Óptimo (45% -&gt; Cierra Válvula OFF)
          </button>
        </div>
      </div>

      {/* Bitácora SHA-256 */}
      <div className="card-premium overflow-hidden">
        <div className="card-header-clean d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={18} className="text-success" />
            <h6 className="font-heading fw-bold text-dark mb-0">Bitácora de Telemetría e Integridad Criptográfica (RN-06)</h6>
          </div>
          <span className="pill-badge pill-badge-info font-mono">SHA-256 Audit Trail</span>
        </div>

        <div className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead style={{ background: '#f8fafc', color: '#475569' }}>
                <tr>
                  <th className="ps-4 py-3">Hora / Fecha</th>
                  <th className="py-3">Dispositivo</th>
                  <th className="py-3">Tipo Evento</th>
                  <th className="py-3">Humedad</th>
                  <th className="py-3">Temperatura</th>
                  <th className="py-3">Válvula</th>
                  <th className="pe-4 py-3">Firma SHA-256 (Evidencia Inmutable)</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, idx) => (
                  <tr key={evt.id || idx}>
                    <td className="ps-4 font-mono text-nowrap">{new Date(evt.created_at).toLocaleTimeString()} <span className="text-muted">({new Date(evt.created_at).toLocaleDateString()})</span></td>
                    <td><span className="badge bg-dark font-mono">{evt.device_id}</span></td>
                    <td><span className="pill-badge pill-badge-info">{evt.event_type}</span></td>
                    <td className="fw-bold text-dark">{evt.soil_moisture !== undefined ? `${evt.soil_moisture}%` : 'N/A'}</td>
                    <td>{evt.temperature !== undefined ? `${evt.temperature}°C` : 'N/A'}</td>
                    <td>
                      <span className={`pill-badge ${evt.valve_status === 'ON' ? 'pill-badge-warning' : 'pill-badge-info'}`}>
                        {evt.valve_status || 'OFF'}
                      </span>
                    </td>
                    <td className="pe-4 font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                      {evt.evidence_hash ? evt.evidence_hash : 'Calculado por Backend'}
                    </td>
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
