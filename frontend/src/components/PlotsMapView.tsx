import React, { useEffect, useRef, useState } from 'react';
import { Plot, User } from '../types';
import { ApiService } from '../services/api';
import { MapPin, Layers, Info, CheckCircle2, PlusCircle, X, Compass, Globe, Sparkles } from 'lucide-react';
import L from 'leaflet';

interface PlotsMapViewProps {
  plots: Plot[];
  onRefreshPlots?: () => void;
  currentUser?: User;
}

export const PlotsMapView: React.FC<PlotsMapViewProps> = ({ plots, onRefreshPlots, currentUser }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Estado para el modal de Registro/Modificación de Parcela
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [code, setCode] = useState<string>('PARC-03-MAC');
  const [name, setName] = useState<string>('Sector La Montaña - Macadamia');
  const [cropType, setCropType] = useState<string>('Nuez de Macadamia de Exportación');
  const [areaHectares, setAreaHectares] = useState<number>(8.50);
  const [irrigationSystem, setIrrigationSystem] = useState<string>('GOTEO_AUTOMATIZADO_ESP32');
  const [wktPolygon, setWktPolygon] = useState<string>(
    'POLYGON((-90.7500 14.5700, -90.7450 14.5700, -90.7450 14.5640, -90.7500 14.5640, -90.7500 14.5700))'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const canManagePlots = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_QA_INSP';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([14.558, -90.738], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    plots.forEach((plot) => {
      if (plot.boundary_geojson) {
        try {
          const geojson = JSON.parse(plot.boundary_geojson);
          const coordinates = geojson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);

          const isAvocado = plot.crop_type.toLowerCase().includes('aguacate');
          const isCoffee = plot.crop_type.toLowerCase().includes('caf');
          const color = isAvocado ? '#059669' : isCoffee ? '#b45309' : '#0284c7';

          const polygon = L.polygon(coordinates, {
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.35
          }).addTo(map);

          polygon.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 210px; padding: 6px;">
              <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 2px;">PostGIS Polygon</div>
              <strong style="color: #0f172a; font-size: 14px; font-weight: 700;">${plot.name}</strong><br/>
              <span style="font-size: 11px; font-family: monospace; color: #64748b;">Código: ${plot.code}</span>
              <hr style="margin: 8px 0; border: 0; border-top: 1px solid #e2e8f0;"/>
              <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                <b>Cultivo:</b> ${plot.crop_type}<br/>
                <b>Superficie:</b> ${plot.area_hectares} Ha<br/>
                <b>Sistema Riego:</b> ${plot.irrigation_system.replace(/_/g, ' ')}
              </div>
            </div>
          `);
        } catch (e) {
          console.error('Error parseando GeoJSON:', e);
        }
      }
    });
  }, [plots]);

  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await ApiService.createPlot({
        code,
        name,
        crop_type: cropType,
        area_hectares: areaHectares,
        wkt_polygon: wktPolygon,
        irrigation_system: irrigationSystem
      });

      if (res.success) {
        setFormFeedback('Parcela y polígono PostGIS registrados exitosamente.');
        if (onRefreshPlots) onRefreshPlots();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormFeedback(null);
        }, 1200);
      } else {
        setFormFeedback(res.message || 'Error al registrar polígono en PostGIS.');
      }
    } catch (err: any) {
      setFormFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      {/* 1. Header Card con Espaciado Generoso y Elegante */}
      <div className="card-premium p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="pill-badge pill-badge-info">
                <Globe size={13} /> Capa Topológica PostGIS
              </span>
              <span className="text-muted fw-medium" style={{ fontSize: '0.82rem' }}>
                Sistema de Coordenadas WGS84 (EPSG:4326) &bull; Indexación GIST
              </span>
            </div>
            <h3 className="font-heading fw-bold text-dark mb-1 fs-4">Delimitación Geoespacial de Parcelas y Polígonos</h3>
            <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
              Geometrías indexadas en PostgreSQL con PostGIS para validación topológica de linderos, no-solapamiento y cálculo exacto de hectáreas.
            </p>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="status-badge-card">
              <CheckCircle2 size={16} />
              <span>PostGIS 16 Spatially Enabled</span>
            </div>

            {canManagePlots && (
              <button 
                type="button" 
                className="btn-action-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <PlusCircle size={16} />
                <span>Registrar / Modificar Parcela</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid Central: Mapa + Detalle de Parcelas */}
      <div className="row g-4">
        {/* Mapa Satelital Leaflet */}
        <div className="col-12 col-lg-8">
          <div className="card-premium overflow-hidden p-0">
            <div className="card-header-clean d-flex justify-content-between align-items-center">
              <span className="fw-bold font-heading small text-dark d-flex align-items-center gap-2">
                <Layers size={17} className="text-primary" />
                <span>Capa Cartográfica Interactiva de Sacatepéquez</span>
              </span>
              <span className="text-muted small">Haga clic en cualquier polígono para inspeccionar atributos</span>
            </div>
            <div className="p-3">
              <div ref={mapContainerRef} style={{ height: '480px', borderRadius: '12px' }}></div>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Parcelas */}
        <div className="col-12 col-lg-4">
          <div className="card-premium h-100 d-flex flex-column p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={18} className="text-success" />
                <h6 className="font-heading mb-0 text-dark fw-bold">Parcelas Registradas ({plots.length})</h6>
              </div>
              <span className="pill-badge pill-badge-neutral">{plots.reduce((a, b) => a + b.area_hectares, 0).toFixed(2)} Ha Totales</span>
            </div>

            <div className="d-flex flex-column gap-3 mb-3">
              {plots.map((plot) => (
                <div key={plot.id} className="p-3 rounded-3 border bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="font-heading fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{plot.name}</span>
                    <span className="font-mono badge bg-dark text-white px-2 py-1">{plot.code}</span>
                  </div>
                  <div className="text-secondary small mb-2">{plot.crop_type}</div>
                  <div className="d-flex justify-content-between text-muted pt-2 border-top" style={{ fontSize: '0.8rem' }}>
                    <span>Área: <strong className="text-dark">{plot.area_hectares} Ha</strong></span>
                    <span>Riego: <strong className="text-dark">{plot.irrigation_system.replace(/_/g, ' ')}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-3 border mt-auto bg-light">
              <div className="d-flex align-items-start gap-2.5 text-dark">
                <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-dark d-block mb-1">Estructura Topológica PostGIS:</strong>
                  Los polígonos están almacenados con el tipo de dato <code className="text-dark bg-white px-1.5 py-0.5 rounded border">GEOMETRY(Polygon, 4326)</code> permitiendo calcular áreas exactas y validar no solapamiento mediante funciones nativas como <code className="text-dark bg-white px-1 py-0.5 rounded border">ST_Area</code> y <code className="text-dark bg-white px-1 py-0.5 rounded border">ST_Intersects</code>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modal para Registrar / Modificar Parcela PostGIS */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <Compass size={20} className="text-success" />
                  <h5 className="modal-title font-heading fw-bold fs-6 mb-0">Registrar / Delimitar Nueva Parcela en PostGIS</h5>
                </div>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setIsModalOpen(false)}></button>
              </div>

              <form onSubmit={handleCreatePlot}>
                <div className="modal-body p-4">
                  {formFeedback && (
                    <div className="alert alert-info py-2 px-3 rounded-3 small mb-3">
                      {formFeedback}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-sm-4">
                      <label className="form-label small fw-semibold text-dark">Código de Parcela</label>
                      <input 
                        type="text" 
                        className="form-control font-mono rounded-3" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="col-12 col-sm-8">
                      <label className="form-label small fw-semibold text-dark">Nombre del Sector / Parcela</label>
                      <input 
                        type="text" 
                        className="form-control rounded-3" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Tipo de Cultivo</label>
                      <input 
                        type="text" 
                        className="form-control rounded-3" 
                        value={cropType} 
                        onChange={(e) => setCropType(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Superficie (Hectáreas)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control rounded-3" 
                        value={areaHectares} 
                        onChange={(e) => setAreaHectares(parseFloat(e.target.value) || 0)} 
                        required 
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">Sistema de Riego Automatizado</label>
                      <select 
                        className="form-select rounded-3"
                        value={irrigationSystem}
                        onChange={(e) => setIrrigationSystem(e.target.value)}
                      >
                        <option value="GOTEO_AUTOMATIZADO_ESP32">Goteo Automatizado con ESP32</option>
                        <option value="ASPERSION_SECTORIZADA">Aspersión Sectorizada</option>
                        <option value="MICROASPERSION_GRAVEDAD">Microaspersión por Gravedad</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Geometría WKT (Well-Known Text) para PostGIS
                      </label>
                      <textarea 
                        className="form-control font-mono rounded-3" 
                        rows={3} 
                        style={{ fontSize: '0.82rem' }}
                        value={wktPolygon} 
                        onChange={(e) => setWktPolygon(e.target.value)} 
                        placeholder="POLYGON((-90.750 14.570, ...))"
                        required 
                      />
                      <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Formato: <code className="text-dark">POLYGON((long1 lat1, long2 lat2, long3 lat3, long4 lat4, long1 lat1))</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-3 px-4 border-top d-flex justify-content-end align-items-center gap-2.5">
                  <button type="button" className="btn-action-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-action-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando en PostGIS...' : 'Guardar Parcela Topológica'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
