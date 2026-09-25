import { Router } from 'express';
import { catalogService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { uploadImportFile } from '../../middleware/upload.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { CatalogController } from './catalog.controller';
import { catalogListQuerySchema, createRoutePointSchema, updateRoutePointSchema } from './catalog.schemas';

const controller = new CatalogController(catalogService);

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

catalogRouter.get('/', validateQuery(catalogListQuerySchema), asyncHandler(controller.list));
catalogRouter.post('/', requireRole('admin'), validateBody(createRoutePointSchema), asyncHandler(controller.create));
catalogRouter.post('/import', requireRole('admin'), uploadImportFile, asyncHandler(controller.importFile));
catalogRouter.put('/:id', requireRole('admin'), validateBody(updateRoutePointSchema), asyncHandler(controller.update));
