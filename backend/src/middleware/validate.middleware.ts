import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../utils/http-error';

function formatZodMessage(error: unknown): string {
  const zodError = error as { errors?: Array<{ path: (string | number)[]; message: string }> };
  if (!zodError.errors) {
    return 'Datos inválidos';
  }
  return zodError.errors
    .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
    .join('; ');
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw badRequest(formatZodMessage(result.error));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw badRequest(formatZodMessage(result.error));
    }
    req.query = result.data as unknown as Request['query'];
    next();
  };
}
