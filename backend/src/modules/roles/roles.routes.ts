import { Router } from 'express';
import { rolesService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { RolesController } from './roles.controller';
import { createRoleSchema, updateRoleSchema } from './roles.schemas';

const controller = new RolesController(rolesService);

export const rolesRouter = Router();

rolesRouter.use(requireAuth, requireRole('admin'));

rolesRouter.get('/', asyncHandler(controller.list));
rolesRouter.post('/', validateBody(createRoleSchema), asyncHandler(controller.create));
rolesRouter.put('/:id', validateBody(updateRoleSchema), asyncHandler(controller.update));
