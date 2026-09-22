import { Router } from 'express';
import { catalogService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { CatalogController } from './catalog.controller';
import { createRoutePointSchema, fechaQuerySchema, updateRoutePointSchema } from './catalog.schemas';

const controller = new CatalogController(catalogService);

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

catalogRouter.get('/', validateQuery(fechaQuerySchema), asyncHandler(controller.list));
catalogRouter.post('/', requireRole('admin'), validateBody(createRoutePointSchema), asyncHandler(controller.create));
catalogRouter.put('/:id', requireRole('admin'), validateBody(updateRoutePointSchema), asyncHandler(controller.update));
