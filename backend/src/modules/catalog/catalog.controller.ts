import { Request, Response } from 'express';
import { CatalogService } from './catalog.service';
import { unauthorized } from '../../utils/http-error';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { fecha } = req.query as { fecha: string };
    const points = await this.catalogService.listByFechaEnriched(fecha);
    res.json(points);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    const point = await this.catalogService.create(req.body, req.user.id);
    res.status(201).json(point);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const point = await this.catalogService.update(req.params.id, req.body);
    res.json(point);
  };
}
