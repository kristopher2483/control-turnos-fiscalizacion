import { Router } from 'express';
import { reportsService } from '../../services';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateQuery } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { ReportsController } from './reports.controller';
import { exportQuerySchema, summaryQuerySchema } from './reports.schemas';

const controller = new ReportsController(reportsService);

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole('admin'));

reportsRouter.get('/summary', validateQuery(summaryQuerySchema), asyncHandler(controller.summary));
reportsRouter.get('/export.csv', validateQuery(exportQuerySchema), asyncHandler(controller.exportCsv));
