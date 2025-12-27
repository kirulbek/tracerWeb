import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../config/jwt.js';

// Расширяем Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }

  req.user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }

  next();
}





