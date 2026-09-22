import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { rolesRouter } from './modules/roles/roles.routes';
import { usersRouter } from './modules/users/users.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { dailyRoutesRouter } from './modules/daily-routes/daily-routes.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.frontendUrl }));
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', storage: env.storageProvider });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/daily-routes', dailyRoutesRouter);
  app.use('/api/reports', reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
