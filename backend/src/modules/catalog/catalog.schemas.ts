import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
const fechaField = z.string().regex(fechaRegex, 'fecha debe tener formato YYYY-MM-DD');

const estadoDisponibilidadEnum = z.enum(['disponible', 'tomado']);

export const catalogListQuerySchema = z
  .object({
    fecha: fechaField.optional(),
    fechaDesde: fechaField.optional(),
    fechaHasta: fechaField.optional(),
    estadoDisponibilidad: estadoDisponibilidadEnum.optional()
  })
  .refine((data) => Boolean(data.fecha) || Boolean(data.fechaDesde && data.fechaHasta), {
    message: 'Debe indicar fecha, o fechaDesde y fechaHasta'
  })
  .refine((data) => !data.fechaDesde || !data.fechaHasta || data.fechaDesde <= data.fechaHasta, {
    message: 'fechaDesde debe ser anterior o igual a fechaHasta'
  });

export type CatalogListQuery = z.infer<typeof catalogListQuerySchema>;

export const createRoutePointSchema = z
  .object({
    fecha: fechaField,
    diaProgramado: z.string().min(1, 'diaProgramado es requerido'),
    sector: z.string().min(1, 'sector es requerido'),
    direccion: z.string().min(1, 'direccion es requerida'),
    empresaResponsable: z.string().min(1, 'empresaResponsable es requerida'),
    tipoExigencia: z.string().min(1, 'tipoExigencia es requerido'),
    descripcionExigencia: z.string().min(1, 'descripcionExigencia es requerida'),
    ventanaEntrada: z.string().min(1, 'ventanaEntrada es requerida'),
    ventanaSalida: z.string().min(1, 'ventanaSalida es requerida'),
    vigenciaDesde: fechaField,
    vigenciaHasta: fechaField,
    assignedInspectorId: z.string().min(1).nullable().optional()
  })
  .refine((data) => data.vigenciaHasta >= data.vigenciaDesde, {
    message: 'vigenciaHasta no puede ser anterior a vigenciaDesde',
    path: ['vigenciaHasta']
  });

export const updateRoutePointSchema = z
  .object({
    fecha: fechaField.optional(),
    diaProgramado: z.string().min(1).optional(),
    sector: z.string().min(1).optional(),
    direccion: z.string().min(1).optional(),
    empresaResponsable: z.string().min(1).optional(),
    tipoExigencia: z.string().min(1).optional(),
    descripcionExigencia: z.string().min(1).optional(),
    ventanaEntrada: z.string().min(1).optional(),
    ventanaSalida: z.string().min(1).optional(),
    vigenciaDesde: fechaField.optional(),
    vigenciaHasta: fechaField.optional(),
    assignedInspectorId: z.string().min(1).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' })
  .refine((data) => !data.vigenciaDesde || !data.vigenciaHasta || data.vigenciaHasta >= data.vigenciaDesde, {
    message: 'vigenciaHasta no puede ser anterior a vigenciaDesde',
    path: ['vigenciaHasta']
  });

export type CreateRoutePointInput = z.infer<typeof createRoutePointSchema>;
export type UpdateRoutePointInput = z.infer<typeof updateRoutePointSchema>;
