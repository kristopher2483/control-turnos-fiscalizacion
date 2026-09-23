import { env } from './config/env';
import { createApp } from './app';
import { seedIfNeeded } from './seed/seed';

async function main(): Promise<void> {
  await seedIfNeeded();

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Control de Turnos backend escuchando en http://localhost:${env.port} (base de datos: Supabase)`);
  });
}

main().catch((error) => {
  console.error('Error fatal al iniciar el servidor:', error);
  process.exit(1);
});
