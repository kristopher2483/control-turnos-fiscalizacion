import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'username debe tener al menos 3 caracteres'),
  fullName: z.string().min(1, 'fullName es requerido'),
  email: z.string().email('email inválido'),
  password: z.string().min(6, 'password debe tener al menos 6 caracteres'),
  roleId: z.string().min(1, 'roleId es requerido')
});

export const updateUserSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    roleId: z.string().min(1).optional(),
    active: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo a actualizar' });

export const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, 'newPassword debe tener al menos 6 caracteres')
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
