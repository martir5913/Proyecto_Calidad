import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { AuditService } from '../services/audit.service';
import { AuditRepository } from '../repositories/audit.repository';
import { pool } from '../config/database';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();
const auditRepo = new AuditRepository(pool);
const auditService = new AuditService(auditRepo);
const auditController = new AuditController(auditService);

router.get('/', authMiddleware, auditController.getAudits);
router.post('/', authMiddleware, requireRoles('ROLE_ADMIN', 'ROLE_QA_INSP', 'ROLE_AUDITOR'), auditController.createAudit);

export default router;
