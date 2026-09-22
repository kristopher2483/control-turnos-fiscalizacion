import { Request, Response } from 'express';
import { UsersService } from './users.service';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.usersService.listPublicUsers();
    res.json(users);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.createUser(req.body);
    res.status(201).json(user);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.updateUser(req.params.id, req.body);
    res.json(user);
  };

  updatePassword = async (req: Request, res: Response): Promise<void> => {
    await this.usersService.updateUserPassword(req.params.id, req.body.newPassword);
    res.json({ ok: true });
  };
}
