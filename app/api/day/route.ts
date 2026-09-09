import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { getDayData } from "@/lib/day-data";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get("class_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = dateSchema.safeParse(new URL(request.url).searchParams.get("date"));
  if (!parsed.success) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  try {
    const viewer = session.role === "teacher"
      ? { role: "teacher", label: "Teacher" }
      : { role: "student", label: `${session.studentName} · Section ${session.section}` };
    return NextResponse.json({ classes: await getDayData(parsed.data, session), viewer });
  }
  catch (error) {
    console.error("Could not load day data", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load classes" }, { status: 502 });
  }
}
