import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcryptjs';

describe('ISO/IEC 25010 - Seguridad: Pruebas Unitarias de Autenticación y RBAC', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let authService: AuthService;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      listByTenant: jest.fn(),
    } as any;

    authService = new AuthService(mockUserRepo);
  });

  it('Debe autenticar exitosamente a un usuario registrado y retornar token JWT', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 8);
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 'user-001',
      tenant_id: 'tenant-001',
      full_name: 'Ing. Fredy Martir',
      email: 'admin@agrochain.gt',
      password_hash: passwordHash,
      role: 'ROLE_ADMIN'
    });

    const result = await authService.login('admin@agrochain.gt', 'Password123!');

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('admin@agrochain.gt');
    expect(result.user.role).toBe('ROLE_ADMIN');
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('Debe rechazar el acceso si el correo electrónico no existe en el sistema', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login('noexiste@agrochain.gt', 'Password123!')
    ).rejects.toThrow(/correo no registrado/);
  });

  it('Debe rechazar el acceso si la contraseña es incorrecta', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword!', 8);
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 'user-001',
      tenant_id: 'tenant-001',
      full_name: 'Ing. Fredy Martir',
      email: 'admin@agrochain.gt',
      password_hash: passwordHash,
      role: 'ROLE_ADMIN'
    });

    await expect(
      authService.login('admin@agrochain.gt', 'WrongPassword123')
    ).rejects.toThrow(/contraseña incorrecta/);
  });

  it('Debe validar y decodificar correctamente un token JWT generado', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 'user-001',
      tenant_id: 'tenant-001',
      full_name: 'Ing. Fredy Martir',
      email: 'admin@agrochain.gt',
      password_hash: '$2a$10$w8TfG3Zk9wT2b5n7zG0q4u7r7y3E1s9P2q5w8r1t3y5u7i9o1p3e.',
      role: 'ROLE_ADMIN'
    });

    const loginRes = await authService.login('admin@agrochain.gt', 'Password123!');
    const decoded = authService.verifyToken(loginRes.token);

    expect(decoded.userId).toBe('user-001');
    expect(decoded.role).toBe('ROLE_ADMIN');
    expect(decoded.email).toBe('admin@agrochain.gt');
  });
});
