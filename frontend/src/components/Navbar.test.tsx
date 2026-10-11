import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from './Navbar';
import { User } from '../types';

const baseUser: User = { full_name: 'Ing. Fredy Martir', email: 'admin@agrochain.gt', role: 'ROLE_ADMIN' };

describe('Navbar - Navegación y Control de Sesión', () => {
  it('renderiza el nombre del usuario autenticado y el rol correspondiente', () => {
    render(
      <Navbar activeTab="dashboard" setActiveTab={vi.fn()} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={vi.fn()} />
    );

    expect(screen.getByText('Ing. Fredy Martir')).toBeInTheDocument();
  });

  it('marca la pestaña activa según la prop activeTab', () => {
    render(
      <Navbar activeTab="telemetry" setActiveTab={vi.fn()} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={vi.fn()} />
    );

    expect(screen.getByText('IoT y Riego').closest('button')).toHaveClass('active');
    expect(screen.getByText('Tablero General').closest('button')).not.toHaveClass('active');
  });

  it('invoca setActiveTab al hacer clic en una pestaña de navegación', async () => {
    const setActiveTab = vi.fn();
    render(
      <Navbar activeTab="dashboard" setActiveTab={setActiveTab} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={vi.fn()} />
    );

    await userEvent.click(screen.getByText('Parcelas GIS'));

    expect(setActiveTab).toHaveBeenCalledWith('map');
  });

  it('invoca onLogout al presionar el botón de cerrar sesión', async () => {
    const onLogout = vi.fn();
    render(
      <Navbar activeTab="dashboard" setActiveTab={vi.fn()} currentUser={baseUser} onLogout={onLogout} onOpenIsoModal={vi.fn()} />
    );

    await userEvent.click(screen.getByTitle('Cerrar Sesión Segura'));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('invoca onOpenIsoModal al presionar el botón de la matriz ISO', async () => {
    const onOpenIsoModal = vi.fn();
    render(
      <Navbar activeTab="dashboard" setActiveTab={vi.fn()} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={onOpenIsoModal} />
    );

    await userEvent.click(screen.getByText('ISO 25010 / 29119'));

    expect(onOpenIsoModal).toHaveBeenCalledOnce();
  });

  it.each([
    ['ROLE_QA_INSP'],
    ['ROLE_FIELD_OP'],
    ['ROLE_AUDITOR'],
    ['ROLE_DESCONOCIDO']
  ] as const)('renderiza correctamente el Navbar para el rol %s sin fallar', (role) => {
    render(
      <Navbar
        activeTab="dashboard"
        setActiveTab={vi.fn()}
        currentUser={{ ...baseUser, role: role as any }}
        onLogout={vi.fn()}
        onOpenIsoModal={vi.fn()}
      />
    );

    expect(screen.getByText('Ing. Fredy Martir')).toBeInTheDocument();
  });

  it('alterna el menú de navegación móvil al presionar el botón de hamburguesa', async () => {
    render(
      <Navbar activeTab="dashboard" setActiveTab={vi.fn()} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={vi.fn()} />
    );

    const toggleBtn = screen.getByLabelText('Alternar menú de navegación');
    await userEvent.click(toggleBtn);
    await userEvent.click(toggleBtn);
  });

  it('navega al tablero general al hacer clic en el logotipo de la marca', async () => {
    const setActiveTab = vi.fn();
    render(
      <Navbar activeTab="map" setActiveTab={setActiveTab} currentUser={baseUser} onLogout={vi.fn()} onOpenIsoModal={vi.fn()} />
    );

    await userEvent.click(screen.getByText('AgroTrace Tech S.A.'));

    expect(setActiveTab).toHaveBeenCalledWith('dashboard');
  });
});
