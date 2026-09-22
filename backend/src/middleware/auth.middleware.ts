import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { unauthorized, forbidden } from '../utils/http-error';
import { RoleName } from '../types';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('Falta el token de autenticación');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw unauthorized('Token inválido o expirado');
  }
}

export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw unauthorized();
    }
    if (!roles.includes(req.user.roleName)) {
      throw forbidden('No tiene permisos para realizar esta acción');
    }
    next();
  };
}
