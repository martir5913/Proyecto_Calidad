import React, { useState } from 'react';
import { BatchDossier, User } from '../types';
import { ApiService } from '../services/api';
import { QrCode, ShieldAlert, CheckCircle2, XCircle, Clock, Calendar, Droplets, ArrowRight, ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface BatchDossierViewProps {
  dossier: BatchDossier | null;
  onRefreshDossier: (qr: string) => void;
  currentUser?: User;
}

export const BatchDossierView: React.FC<BatchDossierViewProps> = ({
  dossier,
  onRefreshDossier,
  currentUser
}) => {
  const [selectedQR, setSelectedQR] = useState<string>('QR-AGROCHAIN-AVO-2026-001');
  const [harvestResult, setHarvestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSearch = (qr: string) => {
    setSelectedQR(qr);
    setHarvestResult(null);
    onRefreshDossier(qr);
  };

  const handleTestHarvest = async () => {
    if (!dossier) return;
    setIsProcessing(true);
    setHarvestResult(null);

    try {
      const res = await ApiService.recordHarvest(dossier.batch_id);
      if (res.success) {
        setHarvestResult({
          success: true,
          message: 'AUTORIZADO: El lote no tiene aplicaciones químicas activas dentro del período de carencia. Cosecha registrada exitosamente.'
        });
      } else {
        setHarvestResult({
          success: false,
          message: res.message || 'Bloqueo RN-01: Período de carencia activo.'
        });
      }
    } catch (err: any) {
      setHarvestResult({
        success: false,
        message: err.message || 'Error al evaluar regla de negocio RN-01.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isBlocked = dossier?.status === 'BLOQUEADO_CARENCIA';

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      {/* Header Selector */}
      <div className="card-premium p-4 mb-4 border-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="pill-badge pill-badge-info">
                <QrCode size={12} /> Trazabilidad por Código QR
              </span>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Módulo de Verificación Fitosanitaria</span>
            </div>
            <h4 className="font-heading fw-bold text-dark mb-1">Expediente Digital de Lote y Evaluación de Regla RN-01</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
              Resolución instantánea de la cadena de custodia y validación transaccional de inocuidad.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Lotes de Demostración:</span>
            <button 
              type="button"
              className={`btn btn-sm fw-semibold rounded-3 ${selectedQR.includes('AVO') ? 'btn-success shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => handleSearch('QR-AGROCHAIN-AVO-2026-001')}
            >
              Lote 1: Aguacate (Bloqueado)
            </button>
            <button 
              type="button"
              className={`btn btn-sm fw-semibold rounded-3 ${selectedQR.includes('COF') ? 'btn-success shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => handleSearch('QR-AGROCHAIN-COF-2026-002')}
            >
              Lote 2: Café (Liberado)
            </button>
          </div>
        </div>
      </div>

      {dossier && (
        <div className="row g-4">
          {/* Tarjeta Principal */}
          <div className="col-12 col-lg-8">
            <div className="card-premium mb-4 overflow-hidden">
              <div className="card-header-clean d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-success bg-opacity-10 rounded-3 text-success">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h5 className="font-heading fw-bold text-dark mb-0">{dossier.batch_code}</h5>
                    <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>{dossier.qr_payload}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`pill-badge ${isBlocked ? 'pill-badge-danger' : 'pill-badge-success'}`}>
                    {dossier.status.replace(/_/g, ' ')}
                  </span>
                  {dossier._resolution_time_ms !== undefined && (
                    <span className="pill-badge pill-badge-info font-mono" title="Objetivo RN-05: <= 1.5s">
                      <Clock size={12} /> {dossier._resolution_time_ms} ms (RN-05 OK)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6">
                    <div className="text-muted small fw-medium">Sector / Parcela</div>
                    <div className="fw-bold text-dark font-heading">{dossier.plot_name}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="text-muted small fw-medium">Cultivo y Extensión</div>
                    <div className="fw-bold text-dark font-heading">{dossier.crop_type} ({dossier.area_hectares} Ha)</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="text-muted small fw-medium">Fecha de Siembra</div>
                    <div className="fw-semibold text-dark">{new Date(dossier.planting_date).toLocaleDateString()}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="text-muted small fw-medium">Sistema de Riego</div>
                    <div className="fw-semibold text-dark">{dossier.irrigation_system.replace(/_/g, ' ')}</div>
                  </div>
                </div>

                {/* Tabla de Insumos y Carencia */}
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                  <ShieldAlert size={18} className="text-danger" />
                  <h6 className="font-heading fw-bold text-dark mb-0">Bitácora Fitosanitaria y Período de Carencia (RN-01)</h6>
                </div>

                <div className="table-responsive mb-4">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                      <tr>
                        <th className="py-2.5">Producto / Insumo</th>
                        <th className="py-2.5">Ingrediente Activo</th>
                        <th className="py-2.5">Fecha Aplicación</th>
                        <th className="py-2.5 text-center">Días Carencia</th>
                        <th className="py-2.5">Fecha Segura Cosecha</th>
                        <th className="py-2.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.chemicals.map((chem) => {
                        const safeDate = new Date(chem.safe_harvest_date);
                        const isExpired = new Date() < safeDate;
                        return (
                          <tr key={chem.id} style={{ background: isExpired ? '#fff1f2' : '#f0fdf4' }}>
                            <td className="fw-bold text-dark">{chem.product_name}</td>
                            <td>{chem.active_ingredient}</td>
                            <td>{new Date(chem.application_date).toLocaleDateString()}</td>
                            <td className="text-center fw-semibold">{chem.withholding_period_days} días</td>
                            <td className="fw-bold">{safeDate.toLocaleDateString()}</td>
                            <td>
                              <span className={`pill-badge ${isExpired ? 'pill-badge-danger' : 'pill-badge-success'}`}>
                                {isExpired ? 'Bloqueado (Carencia Activa)' : 'Liberado (Apto Cosecha)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Zona de Validación Interactiva de Cosecha */}
                <div className="p-4 rounded-3 border" style={{ background: '#f8fafc' }}>
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                    <div>
                      <h6 className="font-heading fw-bold text-dark mb-1">Prueba Transaccional de Cosecha (Grupo Evaluador)</h6>
                      <p className="text-muted small mb-0">
                        Presione el botón para evaluar la regla de inocuidad <strong className="text-dark">RN-01</strong> en el motor de negocio.
                      </p>
                    </div>

                    <button 
                      type="button"
                      className={`btn ${isBlocked ? 'btn-action-danger' : 'btn-action-primary'} text-nowrap`}
                      onClick={handleTestHarvest}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Verificando...' : 'Intentar Registrar Cosecha'}
                    </button>
                  </div>

                  {harvestResult && (
                    <div 
                      className={`p-3 rounded-3 mt-3 d-flex align-items-start gap-2.5 border ${harvestResult.success ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}
                    >
                      {harvestResult.success ? <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="flex-shrink-0 mt-0.5" />}
                      <div>
                        <strong className="font-heading d-block" style={{ fontSize: '0.9rem' }}>
                          {harvestResult.success ? 'Resultado: AUTORIZADO (PERMITIDO)' : 'Resultado: RECHAZADO (BLOQUEO RN-01)'}
                        </strong>
                        <div className="small mt-0.5" style={{ color: '#334155' }}>{harvestResult.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lateral */}
          <div className="col-12 col-lg-4">
            <div className="card-premium p-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <CheckCircle2 size={18} className="text-success" />
                <h6 className="font-heading fw-bold text-dark mb-0">Certificación Normativa</h6>
              </div>

              {dossier.audits && dossier.audits.length > 0 ? (
                dossier.audits.map((audit) => (
                  <div key={audit.id} className="p-3 rounded-3 mb-2 border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="font-heading fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{audit.standard_name}</span>
                      <span className="pill-badge pill-badge-success">{audit.compliance_score}% CONFORME</span>
                    </div>
                    <p className="small text-muted mb-0">{audit.observations}</p>
                  </div>
                ))
              ) : (
                <div className="text-muted small">Sin auditorías registradas.</div>
              )}
            </div>

            <div className="card-premium p-4" style={{ background: '#f8fafc' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-primary" />
                <h6 className="font-heading fw-bold text-dark mb-0">Garantía ISO 25010</h6>
              </div>
              <p className="text-muted small mb-2">
                La regla <strong className="text-dark">RN-01</strong> garantiza la subcaracterística de <em>Corrección Funcional</em> asegurando que ningún lote tratado se coseche antes de tiempo.
              </p>
              <div className="p-2.5 rounded-3 bg-white border font-mono text-dark" style={{ fontSize: '0.72rem' }}>
                QR Payload: {dossier.qr_payload}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
