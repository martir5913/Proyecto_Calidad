import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IsoComplianceModal } from './IsoComplianceModal';

describe('IsoComplianceModal - Matriz de Aseguramiento de Calidad', () => {
  it('no renderiza contenido alguno cuando isOpen es false', () => {
    const { container } = render(<IsoComplianceModal isOpen={false} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza la matriz ISO/IEC 25010 e ISO/IEC/IEEE 29119 cuando isOpen es true', () => {
    render(<IsoComplianceModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Matriz de Aseguramiento de Calidad/)).toBeInTheDocument();
    expect(screen.getByText('Adecuación Funcional')).toBeInTheDocument();
    expect(screen.getByText(/97.25% Cobertura/)).toBeInTheDocument();
  });

  it('invoca onClose al presionar el botón "Cerrar Matriz"', async () => {
    const onClose = vi.fn();
    render(<IsoComplianceModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByText('Cerrar Matriz'));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
