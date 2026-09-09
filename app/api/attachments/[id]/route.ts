import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { canViewClass } from "@/lib/authorization";
import { db } from "@/lib/db";
import { attachmentResponseType } from "@/lib/image-upload";
import { getTimetable } from "@/lib/timetable";

const idSchema = z.string().uuid();

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get("class_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });

  const database = db();
  const { data: attachment, error } = await database
    .from("class_update_attachments")
    .select("class_date, period, group_code, storage_path")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error || !attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  const classItem = (await getTimetable(attachment.class_date)).find(
    (row) => row.group === attachment.group_code && row.period === attachment.period
  );
  if (!classItem || !canViewClass(session, classItem.section)) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const { data: file, error: downloadError } = await database.storage.from("class-work-images").download(attachment.storage_path);
  if (downloadError || !file) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  const extension = attachment.storage_path.split(".").pop();
  const contentType = attachmentResponseType(attachment.storage_path);
  const disposition = extension === "docx" ? "attachment" : "inline";

  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="class-work.${extension}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
