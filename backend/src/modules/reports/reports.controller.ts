import { Request, Response } from 'express';
import { ReportsService } from './reports.service';

export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  summary = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as { desde: string; hasta: string };
    const report = await this.reportsService.summary(query);
    res.json(report);
  };

  exportCsv = async (req: Request, res: Response): Promise<void> => {
    const { fecha } = req.query as { fecha: string };
    const csv = await this.reportsService.exportCsv(fecha);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="registros-${fecha}.csv"`);
    res.status(200).send(csv);
  };
}
