import { Request, Response } from 'express';
import { DailyRoutesService } from './daily-routes.service';
import { unauthorized } from '../../utils/http-error';
import { EstadoDailyRoute } from '../../types';

export class DailyRoutesController {
  constructor(private readonly dailyRoutesService: DailyRoutesService) {}

  mine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const { fecha, fechaDesde, fechaHasta, estado } = req.query as {
      fecha?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      estado?: EstadoDailyRoute;
    };
    const assignments = fecha
      ? await this.dailyRoutesService.listMine(req.user.id, fecha)
      : await this.dailyRoutesService.listMineRange(req.user.id, { fechaDesde: fechaDesde!, fechaHasta: fechaHasta!, estado });
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

  deleteFoto = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const numero = Number(req.params.numero);
    const index = Number(req.params.index);
    const assignment = await this.dailyRoutesService.deleteFoto(req.params.id, numero, index, req.user);
    res.json(assignment);
  };

  reprogramar = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const assignment = await this.dailyRoutesService.reprogramar(req.params.id, req.user, req.body.fecha);
    res.json(assignment);
  };

  listAll = async (req: Request, res: Response): Promise<void> => {
    const assignments = await this.dailyRoutesService.listAll(
      req.query as { fechaDesde?: string; fechaHasta?: string; inspectorId?: string }
    );
    res.json(assignments);
  };
}
