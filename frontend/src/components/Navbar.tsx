import React, { useState } from 'react';
import { Sprout, ShieldCheck, Cpu, MapPin, QrCode, ClipboardCheck, Activity, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  onOpenIsoModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenIsoModal
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return { label: 'Administrador', badgeClass: 'badge bg-danger' };
      case 'ROLE_QA_INSP':
        return { label: 'Inspector Calidad', badgeClass: 'badge bg-success' };
      case 'ROLE_FIELD_OP':
        return { label: 'Operador Campo', badgeClass: 'badge bg-warning text-dark' };
      case 'ROLE_AUDITOR':
        return { label: 'Auditor Externo', badgeClass: 'badge bg-info text-dark' };
      default:
        return { label: role, badgeClass: 'badge bg-secondary' };
    }
  };

  const roleInfo = getRoleLabel(currentUser.role);

  return (
    <header className="app-header sticky-top px-3 px-lg-4 py-2.5">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Brand Logo */}
        <div 
          className="d-flex align-items-center text-decoration-none cursor-pointer"
          style={{ cursor: 'pointer' }}
          onClick={() => handleSelectTab('dashboard')}
        >
          <div className="p-2.5 bg-white bg-opacity-20 rounded-3 d-flex align-items-center justify-content-center shadow-sm me-3">
            <Sprout className="text-warning" size={26} />
          </div>
          <div className="d-flex flex-column">
            <span className="font-heading fs-5 fw-bold text-white lh-1 mb-1">
              AgroChain <span className="fw-medium text-emerald-300" style={{ color: '#6ee7b7' }}>ERP</span>
            </span>
            <span className="text-white-50" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AgroTrace Tech S.A.
            </span>
          </div>
        </div>

        {/* Botón de Hamburguesa para Móvil */}
        <button 
          type="button" 
          className="btn btn-outline-light d-lg-none p-2 rounded-3"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Alternar menú de navegación"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation Tabs (Escritorio + Drawer Móvil Colapsable) */}
        <nav className={`d-lg-flex align-items-center gap-1.5 flex-wrap ${isMobileMenuOpen ? 'd-flex flex-column w-100 py-3 border-top border-white border-opacity-10 mt-2' : 'd-none'}`}>
          <button 
            type="button"
            className={`nav-tab-btn ${isMobileMenuOpen ? 'w-100 justify-content-start' : ''} ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSelectTab('dashboard')}
          >
            <Activity size={16} />
            <span>Tablero General</span>
          </button>

          <button 
            type="button"
            className={`nav-tab-btn ${isMobileMenuOpen ? 'w-100 justify-content-start' : ''} ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleSelectTab('map')}
          >
            <MapPin size={16} />
            <span>Parcelas GIS</span>
          </button>

          <button 
            type="button"
            className={`nav-tab-btn ${isMobileMenuOpen ? 'w-100 justify-content-start' : ''} ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => handleSelectTab('batches')}
          >
            <QrCode size={16} />
            <span>Lotes y QR (RN-01)</span>
          </button>

          <button 
            type="button"
            className={`nav-tab-btn ${isMobileMenuOpen ? 'w-100 justify-content-start' : ''} ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => handleSelectTab('telemetry')}
          >
            <Cpu size={16} />
            <span>IoT y Riego</span>
          </button>

          <button 
            type="button"
            className={`nav-tab-btn ${isMobileMenuOpen ? 'w-100 justify-content-start' : ''} ${activeTab === 'audits' ? 'active' : ''}`}
            onClick={() => handleSelectTab('audits')}
          >
            <ClipboardCheck size={16} />
            <span>Auditorías Calidad</span>
          </button>
        </nav>

        {/* Right Section: Standards, User Info & Logout (Misma Altura y Espaciado Generoso) */}
        <div className={`d-lg-flex align-items-center gap-4 ${isMobileMenuOpen ? 'd-flex flex-column w-100 pt-3 border-top border-white border-opacity-10' : 'd-none'}`}>
          <button 
            type="button"
            className="btn-iso-pill"
            onClick={() => { onOpenIsoModal(); setIsMobileMenuOpen(false); }}
            title="Verificar Matriz de Aseguramiento de Calidad"
          >
            <ShieldCheck size={16} className="text-warning" />
            <span>ISO 25010 / 29119</span>
          </button>

          {/* User Profile Card (40px Altura Idéntica y Espaciado Amplio) */}
          <div className="user-badge-container">
            <div className="user-avatar-circle">
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <span className="fw-bold text-white text-truncate pe-1 ps-1" style={{ fontSize: '0.86rem', maxWidth: '180px' }}>
              {currentUser.full_name}
            </span>

            <button
              type="button"
              className="btn-logout-nav ms-1"
              onClick={onLogout}
              title="Cerrar Sesión Segura"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

