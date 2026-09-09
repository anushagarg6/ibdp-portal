import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function db() {
  const config = env();
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
