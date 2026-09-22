import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
const fechaField = z.string().regex(fechaRegex, 'fecha debe tener formato YYYY-MM-DD');

export const fechaQuerySchema = z.object({
  fecha: fechaField
});

export const adminListQuerySchema = z.object({
  fecha: fechaField.optional(),
  inspectorId: z.string().min(1).optional()
});

export const takeRoutePointSchema = z.object({
  routePointId: z.string().min(1, 'routePointId es requerido'),
  fecha: fechaField
});

export const estadoEnum = z.enum(['pendiente', 'en_progreso', 'fiscalizado', 'no_corresponde', 'liberado']);

// 'liberado' is intentionally excluded here: releasing a route has side effects (it frees the
// catalog point for other inspectors) and must go through the dedicated /release endpoint, not
// be set as a plain field on a general update.
const updatableEstadoEnum = z.enum(['pendiente', 'en_progreso', 'fiscalizado', 'no_corresponde']);

export const updateAssignmentSchema = z
  .object({
    estado: updatableEstadoEnum.optional(),
    observaciones: z.string().optional(),
    horaLlegada: z.string().optional(),
    horaSalida: z.string().optional(),
    nuevaFiscalizacion: z
      .object({
        comentario: z.string().min(1, 'comentario es requerido')
      })
      .optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' });

export type TakeRoutePointInput = z.infer<typeof takeRoutePointSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
