import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { pool } from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const userRepo = new UserRepository(pool);
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

export default router;
