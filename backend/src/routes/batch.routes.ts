import { Router } from 'express';
import { BatchController } from '../controllers/batch.controller';
import { BatchService } from '../services/batch.service';
import { BatchRepository } from '../repositories/batch.repository';
import { pool } from '../config/database';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();
const batchRepo = new BatchRepository(pool);
const batchService = new BatchService(batchRepo);
const batchController = new BatchController(batchService);

router.get('/', authMiddleware, batchController.getAllBatches);
// Endpoint público de resolución de expediente QR (para empacadora, auditor o consumidor final)
router.get('/:qrPayload/dossier', batchController.getDossierByQR);
// Intento de registro de cosecha (evalúa regla RN-01)
router.post('/:id/harvest', authMiddleware, requireRoles('ROLE_ADMIN', 'ROLE_QA_INSP', 'ROLE_FIELD_OP'), batchController.recordHarvest);
// Registro de aplicación fitosanitaria (marca período de carencia)
router.post('/:id/chemicals', authMiddleware, requireRoles('ROLE_ADMIN', 'ROLE_FIELD_OP'), batchController.registerChemical);

export default router;
