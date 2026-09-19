import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginView } from './LoginView';
import { ApiService } from '../services/api';
import { User } from '../types';

vi.mock('../services/api', () => ({
  ApiService: {
    login: vi.fn()
  }
}));

const adminUser: User = {
  full_name: 'Ing. Fredy Martir',
  email: 'admin@agrochain.gt',
  role: 'ROLE_ADMIN'
};

describe('LoginView - Autenticación y RBAC (ISO 25010 Seguridad)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invoca onLoginSuccess con el usuario cuando las credenciales son correctas', async () => {
    (ApiService.login as any).mockResolvedValue({ success: true, data: { token: 'jwt', user: adminUser } });
    const onLoginSuccess = vi.fn();

    render(<LoginView onLoginSuccess={onLoginSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: /acceder a la plataforma/i }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(adminUser));
  });

  it('muestra un mensaje de error y no invoca onLoginSuccess si las credenciales son inválidas', async () => {
    (ApiService.login as any).mockResolvedValue({ success: false, message: 'Credenciales inválidas. Verifique su correo y contraseña.' });
    const onLoginSuccess = vi.fn();

    render(<LoginView onLoginSuccess={onLoginSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: /acceder a la plataforma/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('permite escribir un correo y contraseña personalizados en el formulario', async () => {
    (ApiService.login as any).mockResolvedValue({ success: true, data: { token: 'jwt', user: adminUser } });

    render(<LoginView onLoginSuccess={vi.fn()} />);
    const emailInput = screen.getByPlaceholderText('ejemplo@agrochain.gt') as HTMLInputElement;

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'campo@agrochain.gt');

    expect(emailInput.value).toBe('campo@agrochain.gt');
  });

  it('permite escribir una contraseña personalizada en el formulario', async () => {
    (ApiService.login as any).mockResolvedValue({ success: true, data: { token: 'jwt', user: adminUser } });

    render(<LoginView onLoginSuccess={vi.fn()} />);
    const passwordInput = screen.getByPlaceholderText('Contraseña') as HTMLInputElement;

    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'OtraClave456!');

    expect(passwordInput.value).toBe('OtraClave456!');
  });

  it('el botón de acceso rápido de rol ROLE_ADMIN inicia sesión con las credenciales del administrador', async () => {
    (ApiService.login as any).mockResolvedValue({ success: true, data: { token: 'jwt', user: adminUser } });
    const onLoginSuccess = vi.fn();

    render(<LoginView onLoginSuccess={onLoginSuccess} />);
    await userEvent.click(screen.getByText('Ing. Fredy Martir'));

    await waitFor(() => {
      expect(ApiService.login).toHaveBeenCalledWith('admin@agrochain.gt', 'Password123!');
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });

  it('el botón de acceso rápido de rol Operador de Campo inicia sesión con sus credenciales', async () => {
    (ApiService.login as any).mockResolvedValue({
      success: true,
      data: { token: 'jwt', user: { ...adminUser, role: 'ROLE_FIELD_OP', email: 'campo@agrochain.gt' } }
    });

    render(<LoginView onLoginSuccess={vi.fn()} />);
    await userEvent.click(screen.getByText('Agr. Esdras Ajanel'));

    await waitFor(() => {
      expect(ApiService.login).toHaveBeenCalledWith('campo@agrochain.gt', 'Password123!');
    });
  });

  it('el botón de acceso rápido de rol QA_INSP inicia sesión con las credenciales del inspector de calidad', async () => {
    (ApiService.login as any).mockResolvedValue({
      success: true,
      data: { token: 'jwt', user: { ...adminUser, role: 'ROLE_QA_INSP', email: 'qa@agrochain.gt' } }
    });
    const onLoginSuccess = vi.fn();

    render(<LoginView onLoginSuccess={onLoginSuccess} />);
    await userEvent.click(screen.getByText('Lic. Daniel Maldonado'));

    await waitFor(() => {
      expect(ApiService.login).toHaveBeenCalledWith('qa@agrochain.gt', 'Password123!');
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });

  it('el botón de acceso rápido de Auditor Externo inicia sesión de solo lectura', async () => {
    (ApiService.login as any).mockResolvedValue({
      success: true,
      data: { token: 'jwt', user: { ...adminUser, role: 'ROLE_AUDITOR', email: 'auditor@certificadora.org' } }
    });

    render(<LoginView onLoginSuccess={vi.fn()} />);
    await userEvent.click(screen.getByText('Auditor GlobalGAP'));

    await waitFor(() => {
      expect(ApiService.login).toHaveBeenCalledWith('auditor@certificadora.org', 'Password123!');
    });
  });

  it('deshabilita el botón de envío mientras se está verificando la sesión', async () => {
    let resolveLogin: (v: any) => void;
    (ApiService.login as any).mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));

    render(<LoginView onLoginSuccess={vi.fn()} />);
    const submitBtn = screen.getByRole('button', { name: /acceder a la plataforma/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled();
    resolveLogin!({ success: false, message: 'error' });
    await waitFor(() => expect(screen.getByText('error')).toBeInTheDocument());
  });

  it('muestra un mensaje de error si ApiService.login lanza una excepción inesperada', async () => {
    (ApiService.login as any).mockRejectedValue(new Error('Fallo crítico de conexión'));

    render(<LoginView onLoginSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /acceder a la plataforma/i }));

    expect(await screen.findByText('Fallo crítico de conexión')).toBeInTheDocument();
  });
});
