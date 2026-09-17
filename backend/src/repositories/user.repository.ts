import { Pool } from 'pg';
import { User } from '../models/types';

export class UserRepository {
  constructor(private db: Pool) {}

  public async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, tenant_id, full_name, email, password_hash, role, created_at
      FROM users
      WHERE email = $1
      LIMIT 1;
    `;
    const result = await this.db.query(query, [email]);
    return result.rows.length ? (result.rows[0] as User) : null;
  }

  public async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, tenant_id, full_name, email, role, created_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await this.db.query(query, [id]);
    return result.rows.length ? (result.rows[0] as User) : null;
  }

  public async listByTenant(tenantId: string): Promise<User[]> {
    const query = `
      SELECT id, tenant_id, full_name, email, role, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows as User[];
  }
}
