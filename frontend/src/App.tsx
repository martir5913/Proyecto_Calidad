import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PlotsMapView } from './components/PlotsMapView';
import { BatchDossierView } from './components/BatchDossierView';
import { TelemetryMonitorView } from './components/TelemetryMonitorView';
import { AuditsView } from './components/AuditsView';
import { IsoComplianceModal } from './components/IsoComplianceModal';
import { ApiService } from './services/api';
import { Plot, BatchDossier, TelemetryEvent, QualityAudit, User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(ApiService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isIsoModalOpen, setIsIsoModalOpen] = useState<boolean>(false);

  const [plots, setPlots] = useState<Plot[]>([]);
  const [dossier, setDossier] = useState<BatchDossier | null>(null);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [audits, setAudits] = useState<QualityAudit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [plotsData, dossierData, eventsData, auditsData] = await Promise.all([
        ApiService.getPlots(),
        ApiService.getBatchDossier('QR-AGROCHAIN-AVO-2026-001'),
        ApiService.getRecentEvents(),
        ApiService.getAudits()
      ]);

      setPlots(plotsData);
      setDossier(dossierData);
      setEvents(eventsData);
      setAudits(auditsData);
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadInitialData();

      // Polling ligero para telemetría en vivo (cada 6 segundos)
      const interval = setInterval(async () => {
        try {
          const evts = await ApiService.getRecentEvents();
          if (evts && evts.length) {
            setEvents(evts);
          }
        } catch (e) {}
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
  };

  const handleRefreshDossier = async (qr: string) => {
    const updated = await ApiService.getBatchDossier(qr);
    setDossier(updated);
  };

  const handleTriggerEmergencyIrrigation = async () => {
    if (dossier) {
      const res = await ApiService.triggerManualIrrigation(dossier.batch_id, 15);
      if (res.success) {
        const evts = await ApiService.getRecentEvents();
        setEvents(evts);
        alert('Comando de electroválvula emitido: RIEGO DE EMERGENCIA ACTIVADO por 15 minutos.');
      } else {
        alert(res.message || 'Error al ejecutar comando de riego.');
      }
    }
  };

  // Si no hay usuario autenticado, mostramos la pantalla de Login
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenIsoModal={() => setIsIsoModalOpen(true)}
      />

      <main className="flex-grow-1">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Cargando AgroChain ERP...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                plots={plots}
                batchDossier={dossier}
                events={events}
                onNavigate={setActiveTab}
                onTriggerIrrigation={handleTriggerEmergencyIrrigation}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'map' && (
              <PlotsMapView 
                plots={plots} 
                onRefreshPlots={async () => {
                  const updatedPlots = await ApiService.getPlots();
                  setPlots(updatedPlots);
                }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'batches' && (
              <BatchDossierView
                dossier={dossier}
                onRefreshDossier={handleRefreshDossier}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'telemetry' && (
              <TelemetryMonitorView
                events={events}
                onRefresh={async () => {
                  const evts = await ApiService.getRecentEvents();
                  setEvents(evts);
                }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'audits' && (
              <AuditsView
                audits={audits}
                onRefresh={async () => {
                  const auds = await ApiService.getAudits();
                  setAudits(auds);
                }}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-top py-3 mt-auto shadow-sm">
        <div className="container-fluid px-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 text-muted small">
              <span><strong>AgroChain ERP v1.0</strong> &bull; Universidad Mariano Gálvez</span>
              <span className="d-none d-lg-inline text-secondary">&bull; Aseguramiento de la Calidad (ISO 25010 / 29119)</span>
            </div>

            {currentUser && (
              <div className="d-flex align-items-center gap-2.5 flex-wrap">
                <span className="text-muted small">Sesión activa: <strong className="text-dark">{currentUser.full_name}</strong></span>
                <span className={`badge ${
                  currentUser.role === 'ROLE_ADMIN' ? 'bg-danger text-white' :
                  currentUser.role === 'ROLE_QA_INSP' ? 'bg-success text-white' :
                  currentUser.role === 'ROLE_FIELD_OP' ? 'bg-warning text-dark' :
                  'bg-info text-dark'
                } rounded-pill px-2.5 py-1 fw-semibold`} style={{ fontSize: '0.74rem', letterSpacing: '0.02em' }}>
                  {currentUser.role === 'ROLE_ADMIN' ? 'Administrador (ROLE_ADMIN)' :
                   currentUser.role === 'ROLE_QA_INSP' ? 'Inspector de Calidad (ROLE_QA_INSP)' :
                   currentUser.role === 'ROLE_FIELD_OP' ? 'Operador de Campo (ROLE_FIELD_OP)' :
                   'Auditor Externo (ROLE_AUDITOR)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>

      <IsoComplianceModal
        isOpen={isIsoModalOpen}
        onClose={() => setIsIsoModalOpen(false)}
      />
    </div>
  );
};

