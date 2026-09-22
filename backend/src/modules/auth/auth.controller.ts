import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { unauthorized } from '../../utils/http-error';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    res.json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const user = await this.authService.me(req.user.id);
    res.json(user);
  };
}
