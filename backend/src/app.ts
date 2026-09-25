import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

  // Render (and most PaaS) sit the app behind one reverse proxy — this makes Express trust the
  // X-Forwarded-For header from that single hop, so req.ip (used by the login rate limiter) reflects
  // the real client IP instead of the proxy's, which would otherwise bucket every user together.
  app.set('trust proxy', 1);

  // This API only ever serves JSON, never HTML, so the CSP/COEP directives helmet defaults to for
  // HTML pages don't apply here — disabled to avoid interfering with the JSON responses/CORS.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: env.frontendUrl }));
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', database: 'supabase' });
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
