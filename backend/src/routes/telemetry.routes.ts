import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetry.controller';
import { TelemetryService } from '../services/telemetry.service';
import { TelemetryRepository } from '../repositories/telemetry.repository';
import { pool } from '../config/database';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();
const telemetryRepo = new TelemetryRepository(pool);
const telemetryService = new TelemetryService(telemetryRepo);
const telemetryController = new TelemetryController(telemetryService);

// Ingestión de telemetría desde ESP32 / simulador (HTTP POST)
router.post('/telemetry', telemetryController.recordTelemetry);
// Consulta de bitácora de eventos
router.get('/events', telemetryController.getRecentEvents);
// Activación manual de electroválvula de riego
router.post('/irrigation/manual', authMiddleware, requireRoles('ROLE_ADMIN', 'ROLE_FIELD_OP', 'ROLE_QA_INSP'), telemetryController.triggerManualIrrigation);

export default router;
