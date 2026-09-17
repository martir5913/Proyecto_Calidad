import { Router } from 'express';
import { PlotController } from '../controllers/plot.controller';
import { PlotService } from '../services/plot.service';
import { PlotRepository } from '../repositories/plot.repository';
import { pool } from '../config/database';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();
const plotRepo = new PlotRepository(pool);
const plotService = new PlotService(plotRepo);
const plotController = new PlotController(plotService);

router.get('/', authMiddleware, plotController.getPlots);
router.post('/', authMiddleware, requireRoles('ROLE_ADMIN', 'ROLE_QA_INSP'), plotController.createPlot);

export default router;
