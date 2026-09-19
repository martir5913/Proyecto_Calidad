import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditsView } from './AuditsView';
import { ApiService } from '../services/api';
import { QualityAudit, User } from '../types';

vi.mock('../services/api', () => ({
  ApiService: {
    getToken: vi.fn().mockReturnValue('jwt-fake')
  }
}));

const qaUser: User = { full_name: 'Lic. Daniel Maldonado', email: 'qa@agrochain.gt', role: 'ROLE_QA_INSP' };
const fieldOpUser: User = { full_name: 'Agr. Esdras Ajanel', email: 'campo@agrochain.gt', role: 'ROLE_FIELD_OP' };

const audits: QualityAudit[] = [
  { id: 'a1', batch_id: 'b1', batch_code: 'BATCH-2026-AVO-001', standard_name: 'GLOBALGAP', compliance_score: 96.5, is_compliant: true, created_at: new Date().toISOString() },
  { id: 'a2', batch_id: 'b2', batch_code: 'BATCH-2026-COF-002', standard_name: 'USDA_ORGANIC', compliance_score: 65, is_compliant: false, created_at: new Date().toISOString() }
];

describe('AuditsView - Umbral de Conformidad Normativa (>=90%)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any) = vi.fn();
  });

  it('muestra el formulario de dictamen para ROLE_QA_INSP (rol autorizado)', () => {
    render(<AuditsView audits={[]} onRefresh={vi.fn()} currentUser={qaUser} />);

    expect(screen.getByText('Emitir Dictamen de Auditoría')).toBeInTheDocument();
  });

  it('restringe la emisión de dictámenes para ROLE_FIELD_OP (RBAC de solo lectura)', () => {
    render(<AuditsView audits={[]} onRefresh={vi.fn()} currentUser={fieldOpUser} />);

    expect(screen.getByText('Emisión de Dictámenes Restringida')).toBeInTheDocument();
    expect(screen.queryByText('Emitir Dictamen de Auditoría')).not.toBeInTheDocument();
  });

  it('renderiza el historial de dictámenes con su estado CONFORME o NO CONFORME', () => {
    render(<AuditsView audits={audits} onRefresh={vi.fn()} currentUser={qaUser} />);

    expect(screen.getByText('CONFORME')).toBeInTheDocument();
    expect(screen.getByText('NO CONFORME')).toBeInTheDocument();
  });

  it('envía el dictamen al backend y refresca la lista al presionar "Emitir Dictamen"', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ success: true, data: { is_compliant: true } })
    });
    const onRefresh = vi.fn();

    render(<AuditsView audits={[]} onRefresh={onRefresh} currentUser={qaUser} />);
    await userEvent.click(screen.getByText('Emitir Dictamen de Auditoría'));

    expect(await screen.findByText(/CONFORME \(Aprobada\)/)).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/audits', expect.objectContaining({ method: 'POST' }));
  });

  it('muestra un mensaje de error si el registro del dictamen falla por un error de red', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Backend no disponible'));

    render(<AuditsView audits={[]} onRefresh={vi.fn()} currentUser={qaUser} />);
    await userEvent.click(screen.getByText('Emitir Dictamen de Auditoría'));

    expect(await screen.findByText(/Error al registrar: Backend no disponible/)).toBeInTheDocument();
  });

  it('permite cambiar la normativa evaluada entre GLOBALGAP y USDA Organic', async () => {
    render(<AuditsView audits={[]} onRefresh={vi.fn()} currentUser={qaUser} />);

    const select = screen.getByDisplayValue('GLOBALG.A.P. (Buenas Prácticas Agrícolas)') as HTMLSelectElement;
    await userEvent.selectOptions(select, 'USDA_ORGANIC');

    expect(select.value).toBe('USDA_ORGANIC');
  });

  it('permite ajustar el puntaje de conformidad y editar las observaciones del inspector', () => {
    render(<AuditsView audits={[]} onRefresh={vi.fn()} currentUser={qaUser} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '88' } });
    expect(screen.getByText('88%')).toBeInTheDocument();

    const textarea = screen.getByDisplayValue(/Cumple con los puntos de control/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Observación editada por el inspector.' } });
    expect(textarea.value).toBe('Observación editada por el inspector.');
  });
});
