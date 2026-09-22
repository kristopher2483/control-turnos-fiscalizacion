import { Router } from 'express';
import { authService } from '../../services';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { AuthController } from './auth.controller';
import { loginSchema } from './auth.schemas';

const controller = new AuthController(authService);

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
