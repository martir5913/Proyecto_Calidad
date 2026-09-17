import { PlotService } from '../../src/services/plot.service';
import { PlotRepository } from '../../src/repositories/plot.repository';

describe('ISO/IEC 25010 - Adecuación Funcional: Pruebas Unitarias de Gestión Espacial de Parcelas (RN-02)', () => {
  let mockPlotRepo: jest.Mocked<PlotRepository>;
  let plotService: PlotService;

  beforeEach(() => {
    mockPlotRepo = {
      findAllByTenant: jest.fn(),
      findById: jest.fn(),
      create: jest.fn()
    } as any;

    plotService = new PlotService(mockPlotRepo);
  });

  it('Debe obtener todas las parcelas asociadas a un tenant_id', async () => {
    const mockPlots = [
      {
        id: 'plot-1',
        tenant_id: 'tenant-1',
        code: 'PARC-01',
        name: 'Sector Los Volcanes',
        crop_type: 'Aguacate Hass',
        area_hectares: 12.5,
        irrigation_system: 'GOTEO'
      }
    ];

    mockPlotRepo.findAllByTenant.mockResolvedValue(mockPlots);

    const result = await plotService.getPlots('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('PARC-01');
    expect(mockPlotRepo.findAllByTenant).toHaveBeenCalledWith('tenant-1');
  });

  it('Debe consultar una parcela específica por id y tenant_id', async () => {
    const mockPlot = {
      id: 'plot-1',
      tenant_id: 'tenant-1',
      code: 'PARC-01',
      name: 'Sector Los Volcanes',
      crop_type: 'Aguacate Hass',
      area_hectares: 12.5,
      irrigation_system: 'GOTEO'
    };

    mockPlotRepo.findById.mockResolvedValue(mockPlot);

    const result = await plotService.getPlotById('plot-1', 'tenant-1');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Sector Los Volcanes');
  });

  it('Debe crear una nueva parcela si el polígono WKT es válido', async () => {
    const validWkt = 'POLYGON((-90.7385 14.5580, -90.7320 14.5580, -90.7320 14.5520, -90.7385 14.5520, -90.7385 14.5580))';
    const mockCreated = {
      id: 'new-plot-id',
      tenant_id: 'tenant-1',
      code: 'PARC-NEW',
      name: 'Nueva Parcela',
      crop_type: 'Café',
      area_hectares: 10.0,
      irrigation_system: 'GOTEO_AUTOMATIZADO'
    };

    mockPlotRepo.create.mockResolvedValue(mockCreated);

    const result = await plotService.createPlot('tenant-1', {
      code: 'PARC-NEW',
      name: 'Nueva Parcela',
      crop_type: 'Café',
      area_hectares: 10.0,
      wkt_polygon: validWkt
    });

    expect(result.id).toBe('new-plot-id');
    expect(mockPlotRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PARC-NEW' }),
      validWkt
    );
  });

  it('Debe rechazar la creación si el formato WKT no inicia con POLYGON', async () => {
    await expect(
      plotService.createPlot('tenant-1', {
        code: 'PARC-INVALID',
        name: 'Parcela Inválida',
        crop_type: 'Maíz',
        area_hectares: 5.0,
        wkt_polygon: 'POINT(-90.7385 14.5580)'
      })
    ).rejects.toThrow(/Formato espacial inválido/);
  });
});
