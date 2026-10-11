import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from './DashboardView';
import { Plot, TelemetryEvent, User } from '../types';

const plots: Plot[] = [
  { id: 'p1', code: 'PARC-01', name: 'Sector Volcanes', crop_type: 'Aguacate', area_hectares: 12.5, irrigation_system: 'GOTEO_AUTOMATIZADO' },
  { id: 'p2', code: 'PARC-02', name: 'Sector Mirador', crop_type: 'Café', area_hectares: 18.75, irrigation_system: 'ASPERSION_SECTORIZADA' }
];

const fieldOpUser: User = { full_name: 'Agr. Esdras Ajanel', email: 'campo@agrochain.gt', role: 'ROLE_FIELD_OP' };
const auditorUser: User = { full_name: 'Auditor GlobalGAP', email: 'auditor@certificadora.org', role: 'ROLE_AUDITOR' };

describe('DashboardView - KPIs y Fail-safe de Riego (ISO 25010 Fiabilidad)', () => {
  it('calcula y muestra el total de hectáreas monitoreadas sumando todas las parcelas', () => {
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={vi.fn()} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    expect(screen.getByText('31.25')).toBeInTheDocument();
  });

  it('activa el estado de alerta de suelo seco cuando la humedad del último evento es menor a 25%', () => {
    const events: TelemetryEvent[] = [
      { batch_id: 'b1', device_id: 'ESP32-1', event_type: 'TELEMETRIA_IOT', soil_moisture: 15, temperature: 26, valve_status: 'ON', created_at: new Date().toISOString() }
    ];

    render(
      <DashboardView plots={plots} batchDossier={null} events={events} onNavigate={vi.fn()} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    expect(screen.getByText('15.0')).toBeInTheDocument();
    expect(screen.getByText(/Suelo Seco \(<25%\) — Riego Activo/)).toBeInTheDocument();
  });

  it('muestra la electroválvula en estado OFF cuando la humedad está en rango óptimo', () => {
    const events: TelemetryEvent[] = [
      { batch_id: 'b1', device_id: 'ESP32-1', event_type: 'TELEMETRIA_IOT', soil_moisture: 45, temperature: 22, valve_status: 'OFF', created_at: new Date().toISOString() }
    ];

    render(
      <DashboardView plots={plots} batchDossier={null} events={events} onNavigate={vi.fn()} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    expect(screen.getByText(/Rango de Hidratación Óptimo/)).toBeInTheDocument();
  });

  it('permite al ROLE_FIELD_OP activar el riego manual de emergencia', async () => {
    const onTriggerIrrigation = vi.fn();
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={vi.fn()} onTriggerIrrigation={onTriggerIrrigation} currentUser={fieldOpUser} />
    );

    await userEvent.click(screen.getByText('Activar Riego Manual de Emergencia'));

    expect(onTriggerIrrigation).toHaveBeenCalledOnce();
  });

  it('deshabilita el botón de riego manual para el ROLE_AUDITOR (RBAC de solo lectura)', () => {
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={vi.fn()} onTriggerIrrigation={vi.fn()} currentUser={auditorUser} />
    );

    expect(screen.getByText('Riego Restringido para este Rol').closest('button')).toBeDisabled();
  });

  it('invoca onNavigate al hacer clic en "Verificar Lote QR"', async () => {
    const onNavigate = vi.fn();
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={onNavigate} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    await userEvent.click(screen.getByText('Verificar Lote QR'));

    expect(onNavigate).toHaveBeenCalledWith('batches');
  });

  it('invoca onNavigate al mapa al hacer clic en "Ver Mapa Interactivo" o en una fila de parcela', async () => {
    const onNavigate = vi.fn();
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={onNavigate} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    await userEvent.click(screen.getByText('Ver Mapa Interactivo'));
    expect(onNavigate).toHaveBeenCalledWith('map');

    onNavigate.mockClear();
    await userEvent.click(screen.getByText('PARC-01'));
    expect(onNavigate).toHaveBeenCalledWith('map');
  });

  it('invoca onNavigate a telemetría al hacer clic en "Control IoT de Riego" y en "Abrir Monitor de Telemetría ESP32"', async () => {
    const onNavigate = vi.fn();
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={onNavigate} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    await userEvent.click(screen.getByText('Control IoT de Riego'));
    expect(onNavigate).toHaveBeenCalledWith('telemetry');

    onNavigate.mockClear();
    await userEvent.click(screen.getByText('Abrir Monitor de Telemetría ESP32'));
    expect(onNavigate).toHaveBeenCalledWith('telemetry');
  });

  it('invoca onNavigate al presionar "Verificar Expediente" en el banner de alerta RN-01', async () => {
    const onNavigate = vi.fn();
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={onNavigate} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    await userEvent.click(screen.getByText('Verificar Expediente'));

    expect(onNavigate).toHaveBeenCalledWith('batches');
  });

  it('renderiza cada parcela en la tabla de parcelas productivas registradas', () => {
    render(
      <DashboardView plots={plots} batchDossier={null} events={[]} onNavigate={vi.fn()} onTriggerIrrigation={vi.fn()} currentUser={fieldOpUser} />
    );

    expect(screen.getByText('PARC-01')).toBeInTheDocument();
    expect(screen.getByText('PARC-02')).toBeInTheDocument();
  });
});
