import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { ApiService } from './services/api';
import { User } from './types';

vi.mock('leaflet', () => {
  const mapInstance = { setView: vi.fn().mockReturnThis(), eachLayer: vi.fn(), removeLayer: vi.fn() };
  const L = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polygon: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() })),
    Polygon: class {},
    Marker: class {}
  };
  return { default: L };
});

vi.mock('./services/api', () => ({
  ApiService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getPlots: vi.fn().mockResolvedValue([]),
    getBatchDossier: vi.fn().mockResolvedValue({
      batch_id: 'b1', batch_code: 'BATCH-2026-AVO-001', qr_payload: 'QR-1', status: 'BLOQUEADO_CARENCIA',
      planting_date: new Date().toISOString(), estimated_harvest_date: new Date().toISOString(),
      plot_id: 'p1', plot_name: 'Sector 1', crop_type: 'Aguacate', area_hectares: 1, irrigation_system: 'GOTEO',
      chemicals: [], events: [], audits: []
    }),
    getRecentEvents: vi.fn().mockResolvedValue([]),
    getAudits: vi.fn().mockResolvedValue([]),
    login: vi.fn(),
    createPlot: vi.fn(),
    sendTelemetry: vi.fn(),
    triggerManualIrrigation: vi.fn(),
    getToken: vi.fn().mockReturnValue('jwt-fake')
  }
}));

const adminUser: User = { full_name: 'Ing. Fredy Martir', email: 'admin@agrochain.gt', role: 'ROLE_ADMIN' };

describe('App - Flujo Integral de Sesión y Navegación entre Módulos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ApiService.getPlots as any).mockResolvedValue([]);
    (ApiService.getRecentEvents as any).mockResolvedValue([]);
    (ApiService.getAudits as any).mockResolvedValue([]);
  });

  it('muestra la pantalla de Login cuando no hay una sesión activa', () => {
    (ApiService.getCurrentUser as any).mockReturnValue(null);

    render(<App />);

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('muestra el Tablero General tras un inicio de sesión exitoso', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(null);
    (ApiService.login as any).mockResolvedValue({ success: true, data: { token: 'jwt', user: adminUser } });

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /acceder a la plataforma/i }));

    expect(await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad')).toBeInTheDocument();
    expect(screen.getAllByText('Ing. Fredy Martir').length).toBeGreaterThan(0);
  });

  it('restaura la sesión activa desde localStorage sin requerir un nuevo login', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);

    expect(await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad')).toBeInTheDocument();
  });

  it('navega al módulo de Lotes y QR (RN-01) al hacer clic en la pestaña correspondiente', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Lotes y QR (RN-01)'));

    expect(await screen.findByText('Expediente Digital de Lote y Evaluación de Regla RN-01')).toBeInTheDocument();
  });

  it('navega al módulo de Parcelas GIS y refresca las parcelas', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Parcelas GIS'));

    expect(await screen.findByText('Delimitación Geoespacial de Parcelas y Polígonos')).toBeInTheDocument();
  });

  it('navega al módulo de IoT y Riego (Telemetría) e invoca el refresco de eventos', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('IoT y Riego'));
    await screen.findByText('Núcleo de Telemetría IoT y Control de Riego Automatizado');

    (ApiService.getRecentEvents as any).mockClear();
    await userEvent.click(screen.getByText('Actualizar Telemetría'));

    await waitFor(() => expect(ApiService.getRecentEvents).toHaveBeenCalled());
  });

  it('registra una nueva parcela desde el módulo de Parcelas GIS e invoca el refresco de parcelas', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);
    (ApiService.createPlot as any).mockResolvedValue({ success: true });

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Parcelas GIS'));
    await screen.findByText('Delimitación Geoespacial de Parcelas y Polígonos');

    (ApiService.getPlots as any).mockClear();
    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));
    await userEvent.click(screen.getByText('Guardar Parcela Topológica'));

    await waitFor(() => expect(ApiService.getPlots).toHaveBeenCalled());
  });

  it('emite un dictamen de auditoría desde el módulo de Auditorías e invoca el refresco correspondiente', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);
    (global.fetch as any) = vi.fn().mockResolvedValue({ json: async () => ({ success: true, data: { is_compliant: true } }) });

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Auditorías Calidad'));
    await screen.findByText('Control de Puntos Críticos y Auditorías Normativas');

    (ApiService.getAudits as any).mockClear();
    await userEvent.click(screen.getByText('Emitir Dictamen de Auditoría'));

    await waitFor(() => expect(ApiService.getAudits).toHaveBeenCalled());
  });

  it('activa el riego de emergencia desde el tablero e invoca los servicios asociados (RN-06)', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);
    (ApiService as any).triggerManualIrrigation = vi.fn().mockResolvedValue({ success: true });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Activar Riego Manual de Emergencia'));

    await waitFor(() => expect((ApiService as any).triggerManualIrrigation).toHaveBeenCalledWith('b1', 15));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('RIEGO DE EMERGENCIA ACTIVADO'));
  });

  it('navega al módulo de Auditorías de Calidad', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('Auditorías Calidad'));

    expect(await screen.findByText('Control de Puntos Críticos y Auditorías Normativas')).toBeInTheDocument();
  });

  it('cierra la sesión y regresa a la pantalla de Login al presionar Logout', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByTitle('Cerrar Sesión Segura'));

    await waitFor(() => expect(ApiService.logout).toHaveBeenCalledOnce());
    expect(await screen.findByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('abre y cierra la Matriz de Aseguramiento de Calidad ISO 25010/29119', async () => {
    (ApiService.getCurrentUser as any).mockReturnValue(adminUser);

    render(<App />);
    await screen.findByText('Centro de Monitoreo Agronómico y Trazabilidad');
    await userEvent.click(screen.getByText('ISO 25010 / 29119'));

    expect(await screen.findByText(/Matriz de Aseguramiento de Calidad/)).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cerrar Matriz'));

    expect(screen.queryByText(/Matriz de Aseguramiento de Calidad/)).not.toBeInTheDocument();
  });
});
