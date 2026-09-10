import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTimetable } from "@/lib/timetable";
import { normalizeDate } from "@/lib/timetable-parser";
import { canViewClass } from "@/lib/authorization";
import { hasAllowedOrigin } from "@/lib/request-security";

const schema = z.object({
  date: z.string().trim().min(1),
  group: z.string().trim().min(1).max(80),
  studentId: z.string().uuid()
});

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get("class_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });

  const { date, group, studentId } = parsed.data;
  const normalized = normalizeDate(date);
  if (!normalized) return NextResponse.json({ error: "Invalid date format" }, { status: 400 });

  const timetable = await getTimetable(normalized);
  const classItem = timetable.find((row) => row.group === group);
  if (!classItem) return NextResponse.json({ error: "Class not found for this date" }, { status: 404 });

  if (!canViewClass(session, classItem.section)) {
    return NextResponse.json({ error: "Forbidden: Cannot access class in another section" }, { status: 403 });
  }

  const database = db();

  if (session.role !== "teacher") {
    const { data: member } = await database
      .from("student_subjects")
      .select("student_id")
      .eq("student_id", session.studentId)
      .eq("group_code", group)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Forbidden: Not enrolled in this subject" }, { status: 403 });
    }

    const { data: rotation } = await database
      .from("rotation_history")
      .select("student_id")
      .eq("class_date", normalized)
      .eq("group_code", group)
      .maybeSingle();

    if (rotation && rotation.student_id !== session.studentId) {
      return NextResponse.json({ error: "Forbidden: Only the assigned lead or teacher can reassign this class" }, { status: 403 });
    }
  }

  const { data: targetStudent } = await database
    .from("students")
    .select("id, name, active")
    .eq("id", studentId)
    .maybeSingle();

  if (!targetStudent || !targetStudent.active) {
    return NextResponse.json({ error: "Target student not found or inactive" }, { status: 400 });
  }

  const { data: targetEnrollment } = await database
    .from("student_subjects")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("group_code", group)
    .maybeSingle();

  if (!targetEnrollment) {
    return NextResponse.json({ error: "Selected student is not enrolled in this subject group" }, { status: 400 });
  }

  const { error: upsertError } = await database.from("rotation_history").upsert(
    {
      class_date: normalized,
      group_code: group,
      student_id: studentId,
      selected_at: new Date().toISOString()
    },
    { onConflict: "class_date,group_code" }
  );

  if (upsertError) {
    console.error("Reassign upsert failed", upsertError);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, studentName: targetStudent.name });
}
