import { Router } from 'express';
import authRoutes from './auth.routes';
import plotRoutes from './plot.routes';
import batchRoutes from './batch.routes';
import telemetryRoutes from './telemetry.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/plots', plotRoutes);
router.use('/batches', batchRoutes);
router.use('/iot', telemetryRoutes);
router.use('/audits', auditRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'AgroChain ERP REST API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    standards: ['ISO/IEC 25010', 'ISO/IEC/IEEE 29119']
  });
});

export default router;
