import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'username es requerido'),
  password: z.string().min(1, 'password es requerido')
});

export type LoginInput = z.infer<typeof loginSchema>;
