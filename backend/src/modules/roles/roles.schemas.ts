import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.enum(['admin', 'inspector']),
  label: z.string().min(1, 'label es requerido'),
  description: z.string().min(1, 'description es requerido')
});

export const updateRoleSchema = z
  .object({
    label: z.string().min(1).optional(),
    description: z.string().min(1).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' });

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
