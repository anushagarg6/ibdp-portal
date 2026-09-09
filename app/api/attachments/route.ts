import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { canEditClass, canViewClass } from "@/lib/authorization";
import { db } from "@/lib/db";
import { detectAttachmentType, MAX_ATTACHMENT_BYTES, MAX_CLASS_ATTACHMENTS, safePathPart } from "@/lib/image-upload";
import { hasAllowedOrigin } from "@/lib/request-security";
import { getTimetable } from "@/lib/timetable";

const fieldsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.string().trim().min(1).max(20),
  group: z.string().trim().min(1).max(80)
});

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get("class_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const parsed = fieldsSchema.safeParse({ date: form.get("date"), period: form.get("period"), group: form.get("group") });
  const file = form.get("file");
  if (!parsed.success || !(file instanceof File)) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: "File must be smaller than 4 MB." }, { status: 400 });

  const { date, period, group } = parsed.data;
  const classItem = (await getTimetable(date)).find((row) => row.group === group && row.period === period);
  if (!classItem) return NextResponse.json({ error: "Class not found in timetable" }, { status: 404 });
  if (!canViewClass(session, classItem.section)) return NextResponse.json({ error: "Wrong section" }, { status: 403 });

  const database = db();
  let isSubjectMember = false;
  if (session.role === "student") {
    const { data: membership, error: membershipError } = await database
      .from("student_subjects")
      .select("group_code")
      .eq("student_id", session.studentId)
      .eq("group_code", group)
      .maybeSingle();
    if (membershipError) return NextResponse.json({ error: "Could not verify subject access" }, { status: 500 });
    isSubjectMember = Boolean(membership);
  }
  if (!canEditClass(session, isSubjectMember, classItem.section)) {
    return NextResponse.json({ error: "Only students enrolled in this subject can attach files." }, { status: 403 });
  }

  const { count, error: countError } = await database
    .from("class_update_attachments")
    .select("id", { count: "exact", head: true })
    .eq("class_date", date)
    .eq("period", period)
    .eq("group_code", group);
  if (countError) return NextResponse.json({ error: "Could not check existing files" }, { status: 500 });
  if ((count ?? 0) >= MAX_CLASS_ATTACHMENTS) return NextResponse.json({ error: "This class already has three attachments." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const attachmentType = detectAttachmentType(bytes);
  if (!attachmentType) return NextResponse.json({ error: "Choose a JPEG, PNG, WebP, PDF, or DOCX file." }, { status: 400 });

  const storagePath = `${date}/${safePathPart(group)}/${safePathPart(period)}/${randomUUID()}.${attachmentType.extension}`;
  const bucket = database.storage.from("class-work-images");
  const { error: uploadError } = await bucket.upload(storagePath, bytes, {
    contentType: attachmentType.contentType,
    cacheControl: "3600",
    upsert: false
  });
  if (uploadError) return NextResponse.json({ error: "Could not upload file" }, { status: 500 });

  const { error: insertError } = await database.from("class_update_attachments").insert({
    class_date: date,
    period,
    group_code: group,
    storage_path: storagePath,
    uploaded_by: session.role === "student" ? session.studentId : null
  });
  if (insertError) {
    await bucket.remove([storagePath]);
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
