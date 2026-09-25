import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY')
};
