import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";
import { hasAllowedOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
