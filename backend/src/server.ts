import app from './app';
import { initializeDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('====================================================');
  console.log('       AGROCHAIN ERP - SERVIDOR BACKEND INICIADO     ');
  console.log('  Normas Aplicadas: ISO/IEC 25010 e ISO/IEC 29119    ');
  console.log('  Arquitectura: MVC + N-Capas (Domain Driven)       ');
  console.log('====================================================');

  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(` Servidor escuchando en: http://localhost:${PORT}`);
    console.log(` Endpoint API: http://localhost:${PORT}/api/v1/health`);
  });
}

startServer();
