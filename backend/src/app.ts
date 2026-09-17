import express, { Express } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Express = express();

// Middlewares globales
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.use('/api/v1', apiRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

export default app;
