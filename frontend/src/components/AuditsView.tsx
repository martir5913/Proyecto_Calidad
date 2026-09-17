import React, { useState } from 'react';
import { QualityAudit, User } from '../types';
import { ApiService } from '../services/api';
import { ClipboardCheck, CheckCircle2, AlertCircle, PlusCircle, ShieldCheck, Award, Lock } from 'lucide-react';

interface AuditsViewProps {
  audits: QualityAudit[];
  onRefresh: () => void;
  currentUser?: User;
}

export const AuditsView: React.FC<AuditsViewProps> = ({ audits, onRefresh, currentUser }) => {
  const [standardName, setStandardName] = useState<'GLOBALGAP' | 'USDA_ORGANIC'>('GLOBALGAP');
  const [score, setScore] = useState<number>(95);
  const [notes, setNotes] = useState<string>('Cumple con los puntos de control de inocuidad y manejo de agroquímicos.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const canEmitAudit = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_QA_INSP' || currentUser?.role === 'ROLE_AUDITOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/v1/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ApiService.getToken()}`
        },
        body: JSON.stringify({
          batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
          standard_name: standardName,
          compliance_score: score,
          observations: notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setResultMsg(`Auditoría registrada: ${data.data.is_compliant ? 'CONFORME (Aprobada)' : 'NO CONFORME'}`);
        onRefresh();
      }
    } catch (e: any) {
      setResultMsg(`Error al registrar: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      {/* Header */}
      <div className="card-premium p-4 mb-4 border-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="pill-badge pill-badge-success">
            <Award size={12} /> Certificación de Inocuidad
          </span>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Módulo de Aseguramiento de Calidad</span>
        </div>
        <h4 className="font-heading fw-bold text-dark mb-1">Control de Puntos Críticos y Auditorías Normativas</h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
          Evaluación automática de conformidad con los protocolos internacionales <strong className="text-dark">GLOBALG.A.P. IFA</strong> y <strong className="text-dark">USDA Organic</strong>.
        </p>
      </div>

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-12 col-lg-5">
          <div className="card-premium p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <PlusCircle size={18} className="text-primary" />
              <h6 className="font-heading fw-bold text-dark mb-0">Registrar Dictamen de Auditoría</h6>
            </div>

            {resultMsg && (
              <div className="alert alert-success small rounded-3 mb-3 p-3">
                {resultMsg}
              </div>
            )}

            {canEmitAudit ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Normativa Evaluada</label>
                  <select 
                    className="form-select rounded-3"
                    value={standardName}
                    onChange={(e) => setStandardName(e.target.value as any)}
                  >
                    <option value="GLOBALGAP">GLOBALG.A.P. (Buenas Prácticas Agrícolas)</option>
                    <option value="USDA_ORGANIC">USDA Organic (Certificación Orgánica)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-dark mb-0">Puntaje de Conformidad</label>
                    <span className="font-heading fw-bold text-primary fs-6">{score}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="form-range" 
                    min="50" 
                    max="100" 
                    step="1"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value, 10))}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>50% (No Conforme)</span>
                    <span className="fw-bold text-success">&gt;=90% (Aprobado)</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-dark">Observaciones Técnicas del Inspector</label>
                  <textarea 
                    className="form-control rounded-3" 
                    rows={3} 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn-action-primary w-100 py-2.5" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando Dictamen...' : 'Emitir Dictamen de Auditoría'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-3 bg-light border text-center my-auto">
                <Lock size={32} className="text-muted mb-2" />
                <h6 className="fw-bold text-dark mb-1">Emisión de Dictámenes Restringida</h6>
                <p className="text-muted small mb-0">
                  Su rol actual (<code className="text-dark">{currentUser?.role}</code>) cuenta con permisos de solo lectura para auditorías. Inicie sesión como <strong>Inspector de Calidad</strong> o <strong>Auditor</strong> para registrar nuevos dictámenes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Historial */}
        <div className="col-12 col-lg-7">
          <div className="card-premium h-100 p-0 overflow-hidden">
            <div className="card-header-clean d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <ClipboardCheck size={18} className="text-success" />
                <h6 className="font-heading fw-bold text-dark mb-0">Historial de Dictámenes Emitidos</h6>
              </div>
              <span className="pill-badge pill-badge-info">Certificados Válidos</span>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="ps-4">Fecha</th>
                      <th>Normativa</th>
                      <th>Lote</th>
                      <th>Puntaje</th>
                      <th className="pe-4">Dictamen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id}>
                        <td className="ps-4 font-mono">{new Date(audit.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className="pill-badge pill-badge-neutral fw-bold text-dark font-heading">
                            {audit.standard_name === 'GLOBALGAP' ? 'GLOBALG.A.P. IFA' : 'USDA Organic'}
                          </span>
                        </td>
                        <td className="fw-semibold text-dark font-mono">{audit.batch_code || 'BATCH-2026-AVO-001'}</td>
                        <td className="fw-bold font-heading text-dark">{audit.compliance_score}%</td>
                        <td className="pe-4">
                          {audit.is_compliant ? (
                            <span className="pill-badge pill-badge-success">
                              <CheckCircle2 size={13} /> CONFORME
                            </span>
                          ) : (
                            <span className="pill-badge pill-badge-danger">
                              <AlertCircle size={13} /> NO CONFORME
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
