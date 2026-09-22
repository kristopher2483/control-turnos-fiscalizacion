import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
const fechaField = z.string().regex(fechaRegex, 'fecha debe tener formato YYYY-MM-DD');

export const summaryQuerySchema = z
  .object({
    desde: fechaField,
    hasta: fechaField
  })
  .refine((data) => data.desde <= data.hasta, { message: 'desde debe ser anterior o igual a hasta' });

export const exportQuerySchema = z.object({
  fecha: fechaField
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
