import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'change-this-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  storageProvider: (process.env.STORAGE_PROVIDER ?? 'local') as 'local' | 'drive',
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
  googleDriveRootFolderName: process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME ?? 'ControlTurnos_Data'
};
