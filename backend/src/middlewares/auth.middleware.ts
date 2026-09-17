import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'agrochain-quality-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Acceso denegado: Token de autenticación JWT ausente o inválido.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token expirado o inválido. Inicie sesión nuevamente.',
      timestamp: new Date().toISOString()
    });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'No autenticado.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Acceso restringido: El rol '${req.user.role}' no tiene autorización para esta operación.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}
