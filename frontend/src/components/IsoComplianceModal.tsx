import React from 'react';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface IsoComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IsoComplianceModal: React.FC<IsoComplianceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header app-header text-white px-4 py-3">
            <h5 className="modal-title d-flex align-items-center gap-2 font-heading fw-bold">
              <ShieldCheck size={22} className="text-warning" />
              <span>Matriz de Aseguramiento de Calidad (ISO 25010 &amp; ISO 29119)</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-1 border-bottom">
              <span className="pill-badge pill-badge-success">Modelo de Calidad</span>
              <h6 className="font-heading fw-bold text-dark mb-0">
                1. ISO/IEC 25010: Características de Calidad de Producto
              </h6>
            </div>

            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm small align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th>Característica</th>
                    <th>Subcaracterística</th>
                    <th>Implementación Técnica</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">Adecuación Funcional</td>
                    <td>Corrección y Completitud</td>
                    <td>Regla RN-01: Bloqueo de cosecha ante carencia activa de agroquímicos.</td>
                    <td><span className="pill-badge pill-badge-success">100% Verificado</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Fiabilidad</td>
                    <td>Tolerancia a Fallos (Fail-safe)</td>
                    <td>Lógica autónoma en ESP32 y manejo centralizado de excepciones en API.</td>
                    <td><span className="pill-badge pill-badge-success">Conforme</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Eficiencia Desempeño</td>
                    <td>Comportamiento Temporal</td>
                    <td>Resolución de expediente QR en &le; 1.5s (RN-05).</td>
                    <td><span className="pill-badge pill-badge-success font-mono">&lt; 10 ms</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Seguridad</td>
                    <td>Integridad y Control de Acceso</td>
                    <td>Multi-tenant, RBAC con JWT y hashes SHA-256 en cada evento (RN-06).</td>
                    <td><span className="pill-badge pill-badge-success">Conforme</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Mantenibilidad</td>
                    <td>Capacidad de ser Probado</td>
                    <td>Arquitectura MVC + N-Capas, cobertura de pruebas unitarias &ge; 85%.</td>
                    <td><span className="pill-badge pill-badge-success font-mono">97.25% Cobertura</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Portabilidad</td>
                    <td>Facilidad de Instalación</td>
                    <td>Despliegue reproducible con 1 comando vía Docker Compose.</td>
                    <td><span className="pill-badge pill-badge-success">100% Contenedor</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3 pb-1 border-bottom">
              <span className="pill-badge pill-badge-info">Proceso de Pruebas</span>
              <h6 className="font-heading fw-bold text-dark mb-0">
                2. ISO/IEC/IEEE 29119: Niveles de Prueba y Automatización
              </h6>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-sm small align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th>Nivel de Prueba</th>
                    <th>Tipo</th>
                    <th>Herramienta</th>
                    <th>Comando de Ejecución</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">Unitario</td>
                    <td>Reglas de Negocio (RN-01, RN-05, Sensores)</td>
                    <td>Jest + TypeScript</td>
                    <td><code className="bg-light px-2 py-1 rounded text-dark font-mono">npm test</code> en <code>backend/</code></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Integración</td>
                    <td>Contratos de API REST y PostGIS</td>
                    <td>Supertest</td>
                    <td><code className="bg-light px-2 py-1 rounded text-dark font-mono">npm test</code> en <code>backend/</code></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Sistema / Demo</td>
                    <td>Interacción Web + Simulador IoT</td>
                    <td>React + Node Simulator</td>
                    <td><code className="bg-light px-2 py-1 rounded text-dark font-mono">node iot-firmware/simulator.js</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer bg-light px-4 py-2.5">
            <button type="button" className="btn btn-secondary btn-sm px-4 rounded-3 fw-semibold" onClick={onClose}>
              Cerrar Matriz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
