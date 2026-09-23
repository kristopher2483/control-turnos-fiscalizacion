import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Server-side client authenticated with the service role key, which bypasses Row Level Security.
// This is safe because every table has RLS enabled with no public policies (see supabase/schema.sql) —
// the only way in is this key, which never leaves the backend, plus our own JWT-based authorization
// already gates every route (see middleware/auth.middleware.ts).
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false }
});
