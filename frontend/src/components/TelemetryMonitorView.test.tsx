import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TelemetryMonitorView } from './TelemetryMonitorView';
import { ApiService } from '../services/api';
import { TelemetryEvent, User } from '../types';

vi.mock('../services/api', () => ({
  ApiService: {
    sendTelemetry: vi.fn(),
    triggerManualIrrigation: vi.fn()
  }
}));

const fieldOpUser: User = { full_name: 'Agr. Esdras Ajanel', email: 'campo@agrochain.gt', role: 'ROLE_FIELD_OP' };
const auditorUser: User = { full_name: 'Auditor GlobalGAP', email: 'auditor@certificadora.org', role: 'ROLE_AUDITOR' };

const dryEvent: TelemetryEvent = {
  id: 'e1', batch_id: 'b1', device_id: 'ESP32_SECTOR_01', event_type: 'TELEMETRIA_IOT',
  soil_moisture: 15, temperature: 26.5, valve_status: 'ON', evidence_hash: 'a1b2c3d4', created_at: new Date().toISOString()
};

const wetEvent: TelemetryEvent = {
  id: 'e2', batch_id: 'b1', device_id: 'ESP32_SECTOR_01', event_type: 'TELEMETRIA_IOT',
  soil_moisture: 45, temperature: 22.0, valve_status: 'OFF', evidence_hash: 'f6e5d4c3', created_at: new Date().toISOString()
};

describe('TelemetryMonitorView - Fail-safe IoT (RN-06 Integridad Criptográfica)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activa automáticamente la electroválvula (ON) cuando la humedad reportada es menor a 25%', () => {
    render(<TelemetryMonitorView events={[dryEvent]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    expect(screen.getByText(/Alerta: Suelo Seco/)).toBeInTheDocument();
    expect(screen.getAllByText('ON').length).toBeGreaterThan(0);
  });

  it('cierra la electroválvula (OFF) cuando la humedad reportada está en rango óptimo', () => {
    render(<TelemetryMonitorView events={[wetEvent]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    expect(screen.getByText(/Humedad Óptima/)).toBeInTheDocument();
  });

  it('renderiza el hash SHA-256 de evidencia en la bitácora de telemetría', () => {
    render(<TelemetryMonitorView events={[dryEvent]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
  });

  it('permite a ROLE_FIELD_OP activar el riego manual de emergencia', async () => {
    (ApiService.triggerManualIrrigation as any).mockResolvedValue({ success: true });
    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    await userEvent.click(screen.getByText('Riego Manual de Emergencia'));

    expect(ApiService.triggerManualIrrigation).toHaveBeenCalledWith('c7a8b61c-8e34-4b51-9104-58e1d2f95431', 15);
  });

  it('restringe el riego manual para ROLE_AUDITOR (control de acceso RBAC)', () => {
    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={auditorUser} />);

    expect(screen.getByText('Riego Manual Restringido').closest('button')).toBeDisabled();
  });

  it('el escenario rápido "Suelo Seco" envía una lectura de 15% al backend', async () => {
    (ApiService.sendTelemetry as any).mockResolvedValue({ success: true, actionTaken: 'Electroválvula ACTIVADA' });
    const onRefresh = vi.fn();

    render(<TelemetryMonitorView events={[]} onRefresh={onRefresh} currentUser={fieldOpUser} />);
    await userEvent.click(screen.getByText(/Suelo Seco \(15%/));

    expect(ApiService.sendTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ soil_moisture: 15.0, temperature: 26.5 })
    );
    expect(await screen.findByText(/Electroválvula ACTIVADA/)).toBeInTheDocument();
  });

  it('el escenario rápido "Suelo Óptimo" envía una lectura de 45% al backend', async () => {
    (ApiService.sendTelemetry as any).mockResolvedValue({ success: true, actionTaken: 'Electroválvula CERRADA' });

    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);
    await userEvent.click(screen.getByText(/Suelo Óptimo \(45%/));

    expect(ApiService.sendTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ soil_moisture: 45.0, temperature: 23.0 })
    );
  });

  it('muestra un mensaje de error si el envío de la lectura del sensor falla por un error de red', async () => {
    (ApiService.sendTelemetry as any).mockRejectedValue(new Error('ESP32 sin conexión'));

    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);
    await userEvent.click(screen.getByText('Transmitir al Backend'));

    expect(await screen.findByText(/Error: ESP32 sin conexión/)).toBeInTheDocument();
  });

  it('muestra un mensaje de error si el comando de riego manual falla por un error de red', async () => {
    (ApiService.triggerManualIrrigation as any).mockRejectedValue(new Error('Electroválvula no responde'));

    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);
    await userEvent.click(screen.getByText('Riego Manual de Emergencia'));

    expect(await screen.findByText(/Error al emitir comando: Electroválvula no responde/)).toBeInTheDocument();
  });

  it('permite editar manualmente los valores de humedad y temperatura del simulador', async () => {
    render(<TelemetryMonitorView events={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    const moistureInput = screen.getByDisplayValue('18.5') as HTMLInputElement;
    const tempInput = screen.getByDisplayValue('24') as HTMLInputElement;

    await userEvent.clear(moistureInput);
    await userEvent.type(moistureInput, '32');
    await userEvent.clear(tempInput);
    await userEvent.type(tempInput, '21');

    expect(moistureInput.value).toBe('32');
    expect(tempInput.value).toBe('21');
  });

  it('invoca onRefresh al presionar "Actualizar Telemetría"', async () => {
    const onRefresh = vi.fn();
    render(<TelemetryMonitorView events={[]} onRefresh={onRefresh} currentUser={fieldOpUser} />);

    await userEvent.click(screen.getByText('Actualizar Telemetría'));

    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
