import { Request, Response } from 'express';
import { RolesService } from './roles.service';

export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const roles = await this.rolesService.listRoles();
    res.json(roles);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const role = await this.rolesService.createRole(req.body);
    res.status(201).json(role);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const role = await this.rolesService.updateRole(req.params.id, req.body);
    res.json(role);
  };
}
