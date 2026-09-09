import { NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { accessCodeMatches, createSession, sessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAllowedOrigin } from "@/lib/request-security";

const schema = z.object({
  studentName: z.string().trim().max(100).optional().default(""),
  accessCode: z.string().min(8).max(128)
});
const LIMIT = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 100);
  const database = db();
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: limitError } = await database.from("login_attempts").select("id", { count: "exact", head: true }).eq("ip_address", ip).gte("attempted_at", cutoff);
  if (limitError) {
    console.error("Login rate-limit check failed", limitError.message);
    return NextResponse.json({ error: "Login temporarily unavailable" }, { status: 503 });
  }
  if ((count ?? 0) >= LIMIT) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  let identity: Parameters<typeof createSession>[0] | null = null;
  if (!parsed.data.studentName && accessCodeMatches(parsed.data.accessCode)) {
    identity = { role: "teacher" };
  } else if (parsed.data.studentName) {
    const { data: students, error: studentError } = await database.from("students").select("id,name,section,access_code_hash").eq("active", true);
    if (studentError) {
      console.error("Student login lookup failed", studentError.message);
      return NextResponse.json({ error: "Login temporarily unavailable" }, { status: 503 });
    }
    const student = students?.find((item) => item.name.localeCompare(parsed.data.studentName, undefined, { sensitivity: "base" }) === 0);
    if (student?.access_code_hash && (student.section === "A" || student.section === "B") && await compare(parsed.data.accessCode, student.access_code_hash)) {
      identity = { role: "student", studentId: student.id, studentName: student.name, section: student.section };
    }
  }

  if (!identity) {
    const { error: attemptError } = await database.from("login_attempts").insert({ ip_address: ip });
    if (attemptError) {
      console.error("Login attempt could not be recorded", attemptError.message);
      return NextResponse.json({ error: "Login temporarily unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await database.from("login_attempts").delete().eq("ip_address", ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, createSession(identity), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge
  });
  return response;
}
