import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../../services';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { AuthController } from './auth.controller';
import { loginSchema } from './auth.schemas';

const controller = new AuthController(authService);

export const authRouter = Router();

// Brute-force guard: this app is reachable from the public internet, so without this an attacker
// could try unlimited password guesses against a known username. Keyed by IP; 10 attempts/15min is
// generous for a real user mistyping a password but throttles automated guessing.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.' }
});

authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), asyncHandler(controller.login));
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
