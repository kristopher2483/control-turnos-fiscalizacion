import { Router } from 'express';
import { dailyRoutesService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { uploadFotos } from '../../middleware/upload.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { DailyRoutesController } from './daily-routes.controller';
import {
  adminListQuerySchema,
  mineListQuerySchema,
  reprogramSchema,
  takeRoutePointSchema,
  updateAssignmentSchema
} from './daily-routes.schemas';

const controller = new DailyRoutesController(dailyRoutesService);

export const dailyRoutesRouter = Router();

dailyRoutesRouter.use(requireAuth);

dailyRoutesRouter.get('/mine', validateQuery(mineListQuerySchema), asyncHandler(controller.mine));
dailyRoutesRouter.post(
  '/take',
  requireRole('inspector'),
  validateBody(takeRoutePointSchema),
  asyncHandler(controller.take)
);
dailyRoutesRouter.put(
  '/:id',
  requireRole('inspector'),
  validateBody(updateAssignmentSchema),
  asyncHandler(controller.update)
);
dailyRoutesRouter.post('/:id/release', requireRole('inspector'), asyncHandler(controller.release));
dailyRoutesRouter.post(
  '/:id/fiscalizaciones/:numero/fotos',
  requireRole('inspector'),
  uploadFotos,
  asyncHandler(controller.uploadFotos)
);
dailyRoutesRouter.delete(
  '/:id/fiscalizaciones/:numero/fotos/:index',
  requireRole('inspector'),
  asyncHandler(controller.deleteFoto)
);
dailyRoutesRouter.post(
  '/:id/reprogramar',
  requireRole('admin'),
  validateBody(reprogramSchema),
  asyncHandler(controller.reprogramar)
);
dailyRoutesRouter.get(
  '/',
  requireRole('admin'),
  validateQuery(adminListQuerySchema),
  asyncHandler(controller.listAll)
);
