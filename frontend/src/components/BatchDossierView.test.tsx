import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchDossierView } from './BatchDossierView';
import { ApiService } from '../services/api';
import { BatchDossier, User } from '../types';

vi.mock('../services/api', () => ({
  ApiService: {
    recordHarvest: vi.fn()
  }
}));

const qaUser: User = { full_name: 'Lic. Daniel Maldonado', email: 'qa@agrochain.gt', role: 'ROLE_QA_INSP' };

const blockedDossier: BatchDossier = {
  batch_id: 'c7a8b61c-8e34-4b51-9104-58e1d2f95431',
  batch_code: 'BATCH-2026-AVO-001',
  qr_payload: 'QR-AGROCHAIN-AVO-2026-001',
  status: 'BLOQUEADO_CARENCIA',
  planting_date: '2026-06-15T00:00:00Z',
  estimated_harvest_date: '2026-10-01T00:00:00Z',
  plot_id: 'p1',
  plot_name: 'Sector Los Volcanes',
  crop_type: 'Aguacate Hass',
  area_hectares: 12.5,
  irrigation_system: 'GOTEO_AUTOMATIZADO',
  chemicals: [
    {
      id: 'chem1',
      product_name: 'Fungicida Clorotalonil 720 SC',
      active_ingredient: 'Clorotalonil',
      dosage: '2.0 L/Ha',
      application_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      withholding_period_days: 14,
      safe_harvest_date: new Date(Date.now() + 12 * 86400000).toISOString()
    }
  ],
  events: [],
  audits: [
    { id: 'a1', batch_id: 'b1', standard_name: 'GLOBALGAP', compliance_score: 96.5, is_compliant: true, observations: 'Conforme', created_at: new Date().toISOString() }
  ]
};

describe('BatchDossierView - Regla RN-01 (Período de Carencia) y RN-05 (Expediente QR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza el expediente cuando dossier es null (estado inicial de carga)', () => {
    render(<BatchDossierView dossier={null} onRefreshDossier={vi.fn()} currentUser={qaUser} />);

    expect(screen.queryByText('BATCH-2026-AVO-001')).not.toBeInTheDocument();
  });

  it('muestra el estado BLOQUEADO_CARENCIA y los productos fitosanitarios activos', () => {
    render(<BatchDossierView dossier={blockedDossier} onRefreshDossier={vi.fn()} currentUser={qaUser} />);

    expect(screen.getByText('BATCH-2026-AVO-001')).toBeInTheDocument();
    expect(screen.getByText('BLOQUEADO CARENCIA')).toBeInTheDocument();
    expect(screen.getByText('Fungicida Clorotalonil 720 SC')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado (Carencia Activa)')).toBeInTheDocument();
  });

  it('muestra el tiempo de resolución cuando el dossier incluye la métrica RN-05', () => {
    render(
      <BatchDossierView dossier={{ ...blockedDossier, _resolution_time_ms: 12 }} onRefreshDossier={vi.fn()} currentUser={qaUser} />
    );

    expect(screen.getByText(/12 ms \(RN-05 OK\)/)).toBeInTheDocument();
  });

  it('muestra el mensaje de RECHAZO al intentar cosechar un lote con carencia activa', async () => {
    (ApiService.recordHarvest as any).mockResolvedValue({
      success: false,
      message: "Bloqueo RN-01: Período de carencia activo para el insumo 'Fungicida Clorotalonil 720 SC'."
    });

    render(<BatchDossierView dossier={blockedDossier} onRefreshDossier={vi.fn()} currentUser={qaUser} />);
    await userEvent.click(screen.getByText('Intentar Registrar Cosecha'));

    expect(await screen.findByText(/Resultado: RECHAZADO \(BLOQUEO RN-01\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Fungicida Clorotalonil/).length).toBeGreaterThan(0);
  });

  it('muestra el mensaje de AUTORIZACIÓN al cosechar un lote sin carencia activa', async () => {
    (ApiService.recordHarvest as any).mockResolvedValue({ success: true });
    const librePlot = { ...blockedDossier, status: 'LIBERADO_COSECHA' };

    render(<BatchDossierView dossier={librePlot} onRefreshDossier={vi.fn()} currentUser={qaUser} />);
    await userEvent.click(screen.getByText('Intentar Registrar Cosecha'));

    expect(await screen.findByText(/Resultado: AUTORIZADO \(PERMITIDO\)/)).toBeInTheDocument();
  });

  it('muestra un mensaje de error si la evaluación de la regla RN-01 falla por un error de red', async () => {
    (ApiService.recordHarvest as any).mockRejectedValue(new Error('Servicio de cosecha no disponible'));

    render(<BatchDossierView dossier={blockedDossier} onRefreshDossier={vi.fn()} currentUser={qaUser} />);
    await userEvent.click(screen.getByText('Intentar Registrar Cosecha'));

    expect(await screen.findByText('Servicio de cosecha no disponible')).toBeInTheDocument();
  });

  it('invoca onRefreshDossier con el QR correspondiente al cambiar de lote de demostración', async () => {
    const onRefreshDossier = vi.fn();
    render(<BatchDossierView dossier={blockedDossier} onRefreshDossier={onRefreshDossier} currentUser={qaUser} />);

    await userEvent.click(screen.getByText('Lote 2: Café (Liberado)'));

    expect(onRefreshDossier).toHaveBeenCalledWith('QR-AGROCHAIN-COF-2026-002');
  });

  it('muestra las auditorías de certificación normativa asociadas al lote', () => {
    render(<BatchDossierView dossier={blockedDossier} onRefreshDossier={vi.fn()} currentUser={qaUser} />);

    expect(screen.getByText('GLOBALGAP')).toBeInTheDocument();
    expect(screen.getByText('96.5% CONFORME')).toBeInTheDocument();
  });
});
