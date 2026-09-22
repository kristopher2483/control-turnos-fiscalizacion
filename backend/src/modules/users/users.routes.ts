import { Router } from 'express';
import { usersService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { UsersController } from './users.controller';
import { createUserSchema, updatePasswordSchema, updateUserSchema } from './users.schemas';

const controller = new UsersController(usersService);

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', asyncHandler(controller.list));
usersRouter.post('/', validateBody(createUserSchema), asyncHandler(controller.create));
usersRouter.put('/:id', validateBody(updateUserSchema), asyncHandler(controller.update));
usersRouter.put('/:id/password', validateBody(updatePasswordSchema), asyncHandler(controller.updatePassword));
