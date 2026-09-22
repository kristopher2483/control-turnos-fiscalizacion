import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ message });
}
