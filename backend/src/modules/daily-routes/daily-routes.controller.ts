import { Request, Response } from 'express';
import { DailyRoutesService } from './daily-routes.service';
import { unauthorized } from '../../utils/http-error';

export class DailyRoutesController {
  constructor(private readonly dailyRoutesService: DailyRoutesService) {}

  mine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const { fecha } = req.query as { fecha: string };
    const assignments = await this.dailyRoutesService.listMine(req.user.id, fecha);
    res.json(assignments);
  };

  take = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const assignment = await this.dailyRoutesService.take(req.body, req.user);
    res.status(201).json(assignment);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const assignment = await this.dailyRoutesService.update(req.params.id, req.user, req.body);
    res.json(assignment);
  };

  release = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const assignment = await this.dailyRoutesService.release(req.params.id, req.user);
    res.json(assignment);
  };

  uploadFotos = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const numero = Number(req.params.numero);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const assignment = await this.dailyRoutesService.addFotos(req.params.id, numero, req.user, files);
    res.status(201).json(assignment);
  };

  listAll = async (req: Request, res: Response): Promise<void> => {
    const assignments = await this.dailyRoutesService.listAll(req.query as { fecha?: string; inspectorId?: string });
    res.json(assignments);
  };
}
