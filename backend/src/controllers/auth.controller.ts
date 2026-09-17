import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  constructor(private authService: AuthService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Parámetros requeridos faltantes: email y password.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  public getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: req.user,
      timestamp: new Date().toISOString()
    });
  };
}
