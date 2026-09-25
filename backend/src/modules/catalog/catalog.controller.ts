import { Request, Response } from 'express';
import { CatalogService } from './catalog.service';
import { badRequest, unauthorized } from '../../utils/http-error';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { fecha, fechaDesde, fechaHasta, estadoDisponibilidad } = req.query as {
      fecha?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      estadoDisponibilidad?: 'disponible' | 'tomado';
    };
    const points = fecha
      ? await this.catalogService.listByFechaEnriched(fecha)
      : await this.catalogService.listByRangeEnriched(fechaDesde!, fechaHasta!, estadoDisponibilidad);
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

  importFile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw unauthorized();
    }
    if (!req.file) {
      throw badRequest('Debes adjuntar un archivo .csv o .xlsx');
    }
    const result = await this.catalogService.importFromFile(req.file.buffer, req.user.id);
    res.status(201).json(result);
  };
}
