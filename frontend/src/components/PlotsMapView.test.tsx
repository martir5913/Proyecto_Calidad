import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlotsMapView } from './PlotsMapView';
import { ApiService } from '../services/api';
import { Plot, User } from '../types';

// Leaflet manipula el DOM/canvas de forma incompatible con jsdom; se sustituye
// por un doble de prueba que respeta la API usada por el componente.
vi.mock('leaflet', () => {
  const polygonInstance = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() };
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
    eachLayer: vi.fn(),
    removeLayer: vi.fn()
  };
  const L = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polygon: vi.fn(() => polygonInstance),
    Polygon: class {},
    Marker: class {}
  };
  return { default: L };
});

vi.mock('../services/api', () => ({
  ApiService: {
    createPlot: vi.fn()
  }
}));

const adminUser: User = { full_name: 'Ing. Fredy Martir', email: 'admin@agrochain.gt', role: 'ROLE_ADMIN' };
const fieldOpUser: User = { full_name: 'Agr. Esdras Ajanel', email: 'campo@agrochain.gt', role: 'ROLE_FIELD_OP' };

const plots: Plot[] = [
  {
    id: 'p1', code: 'PARC-01-AVO', name: 'Sector Los Volcanes', crop_type: 'Aguacate Hass', area_hectares: 12.5,
    irrigation_system: 'GOTEO_AUTOMATIZADO',
    boundary_geojson: '{"type":"Polygon","coordinates":[[[-90.7385,14.558],[-90.732,14.558],[-90.732,14.552],[-90.7385,14.552],[-90.7385,14.558]]]}'
  }
];

describe('PlotsMapView - Delimitación Geoespacial PostGIS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista lateral de parcelas registradas con su área total', () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);

    expect(screen.getByText('Sector Los Volcanes')).toBeInTheDocument();
    expect(screen.getByText('12.50 Ha Totales')).toBeInTheDocument();
  });

  it('muestra el botón de registrar parcela solo para roles autorizados (ROLE_ADMIN)', () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);

    expect(screen.getByText('Registrar / Modificar Parcela')).toBeInTheDocument();
  });

  it('oculta el botón de registrar parcela para ROLE_FIELD_OP (sin permiso de gestión GIS)', () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={fieldOpUser} />);

    expect(screen.queryByText('Registrar / Modificar Parcela')).not.toBeInTheDocument();
  });

  it('abre el modal de registro de parcela PostGIS al presionar el botón', async () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);

    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));

    expect(screen.getByText('Registrar / Delimitar Nueva Parcela en PostGIS')).toBeInTheDocument();
  });

  it('envía el polígono WKT al backend al enviar el formulario de nueva parcela', async () => {
    (ApiService.createPlot as any).mockResolvedValue({ success: true });
    const onRefreshPlots = vi.fn();

    render(<PlotsMapView plots={plots} onRefreshPlots={onRefreshPlots} currentUser={adminUser} />);
    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));
    await userEvent.click(screen.getByText('Guardar Parcela Topológica'));

    expect(ApiService.createPlot).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PARC-03-MAC', wkt_polygon: expect.stringContaining('POLYGON') })
    );
    expect(await screen.findByText(/registrados exitosamente/)).toBeInTheDocument();
  });

  it('muestra un mensaje de error si el registro de la parcela falla por un error de red', async () => {
    (ApiService.createPlot as any).mockRejectedValue(new Error('PostGIS no disponible'));

    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);
    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));
    await userEvent.click(screen.getByText('Guardar Parcela Topológica'));

    expect(await screen.findByText(/Error: PostGIS no disponible/)).toBeInTheDocument();
  });

  it('no falla al renderizar una parcela con GeoJSON de límites inválido (manejo de errores defensivo)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidPlots: Plot[] = [{ ...plots[0], boundary_geojson: '{ json-invalido' }];

    expect(() =>
      render(<PlotsMapView plots={invalidPlots} onRefreshPlots={vi.fn()} currentUser={adminUser} />)
    ).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('permite editar todos los campos del formulario de registro de parcela', async () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);
    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));

    const codeInput = screen.getByDisplayValue('PARC-03-MAC') as HTMLInputElement;
    const nameInput = screen.getByDisplayValue('Sector La Montaña - Macadamia') as HTMLInputElement;
    const cropInput = screen.getByDisplayValue('Nuez de Macadamia de Exportación') as HTMLInputElement;
    const areaInput = screen.getByDisplayValue('8.5') as HTMLInputElement;
    const irrigationSelect = screen.getByDisplayValue('Goteo Automatizado con ESP32') as HTMLSelectElement;
    const wktTextarea = screen.getByPlaceholderText('POLYGON((-90.750 14.570, ...))') as HTMLTextAreaElement;

    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'PARC-04-CIT');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Sector Cítricos');
    await userEvent.clear(cropInput);
    await userEvent.type(cropInput, 'Naranja Valencia');
    await userEvent.clear(areaInput);
    await userEvent.type(areaInput, '5');
    await userEvent.selectOptions(irrigationSelect, 'ASPERSION_SECTORIZADA');
    await userEvent.clear(wktTextarea);
    await userEvent.type(wktTextarea, 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))');

    expect(codeInput.value).toBe('PARC-04-CIT');
    expect(areaInput.value).toBe('5');
    expect(irrigationSelect.value).toBe('ASPERSION_SECTORIZADA');
  });

  it('cierra el modal al presionar "Cancelar"', async () => {
    render(<PlotsMapView plots={plots} onRefreshPlots={vi.fn()} currentUser={adminUser} />);

    await userEvent.click(screen.getByText('Registrar / Modificar Parcela'));
    await userEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Registrar / Delimitar Nueva Parcela en PostGIS')).not.toBeInTheDocument();
  });
});
