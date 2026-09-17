import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { User } from '../types';
import { Sprout, ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle, Award, Cpu, FileCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@agrochain.gt');
  const [password, setPassword] = useState<string>('Password123!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await ApiService.login(loginEmail, loginPass);
      if (res.success && res.data?.user) {
        onLoginSuccess(res.data.user);
      } else {
        setErrorMessage(res.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de autenticación con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    handleLogin(undefined, roleEmail, 'Password123!');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: '#f1f5f9' }}>
      {/* Header Bar */}
      <header className="py-3 px-4 bg-white border-bottom shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }}>
              <Sprout size={24} />
            </div>
            <div>
              <div className="font-heading fw-bold fs-5 text-dark" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                AgroChain <span className="text-success">ERP</span>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.02em' }}>
                AgroTrace Tech, S.A. &bull; Inocuidad y Trazabilidad Fitosanitaria
              </span>
            </div>
          </div>

          <div className="d-none d-md-flex align-items-center gap-2">
            <span className="pill-badge pill-badge-success">
              <ShieldCheck size={14} /> ISO/IEC 25010
            </span>
            <span className="pill-badge pill-badge-info">
              <Award size={14} /> ISO/IEC/IEEE 29119
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container py-5 my-auto">
        <div className="row justify-content-center g-4 align-items-stretch">
          {/* Columna Izquierda: Formulario de Login */}
          <div className="col-12 col-lg-5 col-xl-4">
            <div className="card-premium h-100 p-4 p-sm-5 d-flex flex-column justify-content-between">
              <div>
                <div className="mb-4">
                  <span className="pill-badge pill-badge-neutral mb-2">Autenticación Segura</span>
                  <h3 className="font-heading fw-bold text-dark mb-1">Iniciar Sesión</h3>
                  <p className="text-muted small mb-0">
                    Ingrese con sus credenciales de usuario o utilice los accesos rápidos para evaluar cada rol del sistema.
                  </p>
                </div>

                {errorMessage && (
                  <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-start gap-2 mb-3" style={{ fontSize: '0.84rem' }}>
                    <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Correo Institucional</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0 rounded-end-3 font-mono"
                        style={{ fontSize: '0.88rem' }}
                        placeholder="ejemplo@agrochain.gt"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark mb-1">Contraseña de Acceso</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0 ps-0 rounded-end-3"
                        style={{ fontSize: '0.88rem' }}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-action-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Verificando...' : 'Acceder a la Plataforma'}</span>
                    <ArrowRight size={17} />
                  </button>
                </form>
              </div>

              <div className="pt-4 border-top mt-4 text-center">
                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                  Control de Acceso Basado en Roles (RBAC) con Token Criptográfico JWT (8 Horas)
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Selector Rápido de Roles para Evaluación */}
          <div className="col-12 col-lg-7 col-xl-7">
            <div className="card-premium h-100 p-4 p-sm-5 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 pb-2 border-bottom">
                  <div>
                    <h5 className="font-heading fw-bold text-dark mb-1">Accesos Rápidos por Rol (Evaluación)</h5>
                    <span className="text-muted small">Seleccione un perfil para acceder directamente y comprobar sus permisos:</span>
                  </div>
                  <span className="pill-badge pill-badge-info">4 Perfiles RBAC</span>
                </div>

                <div className="row g-3.5">
                  {/* Rol 1: Admin */}
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      className="w-100 text-start p-4 rounded-3 border bg-light text-dark h-100 d-flex flex-column justify-content-between transition-all shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickRole('admin@agrochain.gt')}
                      disabled={isLoading}
                    >
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="pill-badge pill-badge-danger">ROLE_ADMIN</span>
                          <UserCheck size={17} className="text-muted" />
                        </div>
                        <div className="fw-bold font-heading text-dark fs-6 mb-0.5">Ing. Fredy Martir</div>
                        <div className="font-mono text-muted small">admin@agrochain.gt</div>
                      </div>
                      <div className="small text-muted border-top pt-2.5" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                        Acceso total: Control IoT, parcelas GIS, expedientes, auditorías y gobernanza.
                      </div>
                    </button>
                  </div>

                  {/* Rol 2: Operador Campo */}
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      className="w-100 text-start p-4 rounded-3 border bg-light text-dark h-100 d-flex flex-column justify-content-between transition-all shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickRole('campo@agrochain.gt')}
                      disabled={isLoading}
                    >
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="pill-badge pill-badge-warning">ROLE_FIELD_OP</span>
                          <Cpu size={17} className="text-muted" />
                        </div>
                        <div className="fw-bold font-heading text-dark fs-6 mb-0.5">Agr. Esdras Ajanel</div>
                        <div className="font-mono text-muted small">campo@agrochain.gt</div>
                      </div>
                      <div className="small text-muted border-top pt-2.5" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                        Operación en campo: Riego manual ESP32, telemetría y monitoreo de suelo.
                      </div>
                    </button>
                  </div>

                  {/* Rol 3: Inspector Calidad */}
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      className="w-100 text-start p-4 rounded-3 border bg-light text-dark h-100 d-flex flex-column justify-content-between transition-all shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickRole('qa@agrochain.gt')}
                      disabled={isLoading}
                    >
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="pill-badge pill-badge-success">ROLE_QA_INSP</span>
                          <FileCheck size={17} className="text-muted" />
                        </div>
                        <div className="fw-bold font-heading text-dark fs-6 mb-0.5">Lic. Daniel Maldonado</div>
                        <div className="font-mono text-muted small">qa@agrochain.gt</div>
                      </div>
                      <div className="small text-muted border-top pt-2.5" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                        Inocuidad agrícola: Evaluación de carencia RN-01, dictámenes y cosecha.
                      </div>
                    </button>
                  </div>

                  {/* Rol 4: Auditor */}
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      className="w-100 text-start p-4 rounded-3 border bg-light text-dark h-100 d-flex flex-column justify-content-between transition-all shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickRole('auditor@certificadora.org')}
                      disabled={isLoading}
                    >
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="pill-badge pill-badge-info">ROLE_AUDITOR</span>
                          <Award size={17} className="text-muted" />
                        </div>
                        <div className="fw-bold font-heading text-dark fs-6 mb-0.5">Auditor GlobalGAP</div>
                        <div className="font-mono text-muted small">auditor@certificadora.org</div>
                      </div>
                      <div className="small text-muted border-top pt-2.5" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                        Solo Lectura / Certificación: Verificación de evidencias SHA-256 e ISO 25010.
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="text-muted small">
                  Contraseña predeterminada para todos los usuarios: <code className="text-dark bg-light px-1.5 py-0.5 rounded border">Password123!</code>
                </span>
                <span className="badge bg-secondary text-white">Versión 1.0.0 Productiva</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 bg-white border-top text-center text-muted small">
        &copy; 2026 AgroTrace Tech, S.A. — Proyecto de Aseguramiento de Calidad de Software (UMG). Cumplimiento ISO/IEC 25010 e ISO/IEC/IEEE 29119.
      </footer>
    </div>
  );
};
