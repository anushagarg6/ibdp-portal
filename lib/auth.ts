import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { Session } from "@/lib/types";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(payload: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(payload).digest("base64url");
}

export function createSession(identity: { role: "teacher" } | { role: "student"; studentId: string; studentName: string; section: "A" | "B" }) {
  const payload = Buffer.from(JSON.stringify({ ...identity, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function readSession(value?: string): Promise<Session | null> {
  if (!value) return null;
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature) return null;
  const expectedSignature = sign(payload);
  const a = Buffer.from(suppliedSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<Session>;
    if (typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    if (data.role === "teacher") return { role: "teacher", exp: data.exp };
    if (data.role === "student" && typeof data.studentId === "string" && typeof data.studentName === "string" && (data.section === "A" || data.section === "B")) {
      return { role: "student", exp: data.exp, studentId: data.studentId, studentName: data.studentName, section: data.section };
    }
    return null;
  } catch { return null; }
}

export async function isValidSession(value?: string) { return Boolean(await readSession(value)); }

export function accessCodeMatches(supplied: string) {
  const expected = Buffer.from(env().CLASSROOM_ACCESS_CODE);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const sessionCookie = { name: "class_session", maxAge: MAX_AGE_SECONDS };
