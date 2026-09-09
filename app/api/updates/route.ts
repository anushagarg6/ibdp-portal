import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTimetable } from "@/lib/timetable";
import { hasAllowedOrigin } from "@/lib/request-security";
import { canEditClass, canViewClass } from "@/lib/authorization";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.string().trim().min(1).max(20),
  group: z.string().trim().min(1).max(80),
  covered: z.string().trim().max(2000),
  homework: z.string().trim().max(1000),
  absentNames: z.string().trim().max(500)
});

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get("class_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const { date, period, group, covered, homework, absentNames } = parsed.data;
  const classItem = (await getTimetable(date)).find((row) => row.group === group && row.period === period);
  if (!classItem) return NextResponse.json({ error: "Class not found in timetable" }, { status: 404 });
  if (!canViewClass(session, classItem.section)) return NextResponse.json({ error: "Wrong section" }, { status: 403 });

  const database = db();
  const { data: rotation, error: rotationError } = await database.from("rotation_history").select("student_id").eq("class_date", date).eq("group_code", group).maybeSingle();
  if (rotationError) throw rotationError;

  let isSubjectMember = false;
  if (session.role === "student") {
    const { data: membership, error: membershipError } = await database
      .from("student_subjects")
      .select("group_code")
      .eq("student_id", session.studentId)
      .eq("group_code", group)
      .maybeSingle();
    if (membershipError) throw membershipError;
    isSubjectMember = Boolean(membership);
  }
  if (!canEditClass(session, isSubjectMember, classItem.section)) {
    return NextResponse.json({ error: "Only students enrolled in this subject can edit this class" }, { status: 403 });
  }

  const { error } = await database.from("class_updates").upsert({
    class_date: date,
    period,
    group_code: group,
    student_id: session.role === "student" ? session.studentId : rotation?.student_id ?? null,
    covered,
    homework,
    absent_names: absentNames,
    updated_at: new Date().toISOString()
  }, { onConflict: "class_date,period,group_code" });
  if (error) {
    console.error("Could not save class update", error.message);
    return NextResponse.json({ error: "Could not save update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
