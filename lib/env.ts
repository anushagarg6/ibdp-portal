import "server-only";
import { z } from "zod";

const schema = z.object({
  TIMETABLE_CSV_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  CLASSROOM_ACCESS_CODE: z.string().min(8),
  SESSION_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(8),
  EMAIL_FROM: z.string().min(3),
  EMAIL_TO: z.string().email(),
  APP_URL: z.string().url(),
  APP_TIME_ZONE: z.string().default("Asia/Kolkata")
});

export function env() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Missing or invalid server configuration: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  return parsed.data;
}
