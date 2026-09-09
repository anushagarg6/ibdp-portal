import "server-only";
import { env } from "@/lib/env";

export function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try { return new URL(origin).origin === new URL(env().APP_URL).origin; }
  catch { return false; }
}
