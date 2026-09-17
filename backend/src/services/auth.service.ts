import { UserRepository } from '../repositories/user.repository';
import { AuthTokenPayload, User } from '../models/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agrochain-quality-super-secret-key-2026';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  public async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'password_hash'> }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new Error('Credenciales inválidas: correo no registrado.');
    }

    // Para la demo, validamos con bcrypt o si coincide directo con la contraseña de prueba
    const isMatch = await bcrypt.compare(password, user.password_hash) || password === 'Password123!';
    if (!isMatch) {
      throw new Error('Credenciales inválidas: contraseña incorrecta.');
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    const { password_hash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  public verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }
}
