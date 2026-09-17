import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'agrochain',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initializeDatabase(): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, '../../sql/01_schema.sql');
    const seedPath = path.join(__dirname, '../../sql/02_seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log(' [DB] Esquema DDL inicializado correctamente.');
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
      console.log(' [DB] Datos Seed iniciales cargados correctamente.');
    }
  } catch (error) {
    console.error(' [DB Warning] No se pudo inicializar la base de datos automáticamente (verifique conexión):', error);
  }
}
