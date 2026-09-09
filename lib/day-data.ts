import "server-only";
import { db } from "@/lib/db";
import { getTimetable } from "@/lib/timetable";
import type { Session } from "@/lib/types";
import { canEditClass, canViewClass } from "@/lib/authorization";
import { attachmentKindFromPath } from "@/lib/image-upload";

export async function getDayData(date: string, session: Session) {
  const fullTimetable = await getTimetable(date);
  const timetable = fullTimetable.filter((row) => canViewClass(session, row.section));
  const groups = [...new Set(timetable.map((row) => row.group))];
  if (!groups.length) return [];
  const database = db();
  const [
    { data: rotations, error: rotationError },
    { data: updates, error: updateError },
    { data: attachments, error: attachmentError }
  ] = await Promise.all([
    database.from("rotation_history").select("student_id, group_code, students(name)").eq("class_date", date).in("group_code", groups),
    database.from("class_updates").select("period, group_code, covered, homework, absent_names").eq("class_date", date).in("group_code", groups),
    database.from("class_update_attachments").select("id, period, group_code, storage_path").eq("class_date", date).in("group_code", groups).order("created_at")
  ]);
  if (rotationError) throw rotationError;
  if (updateError) throw updateError;
  if (attachmentError) throw attachmentError;

  const editableGroups = new Set<string>();
  if (session.role === "teacher") {
    groups.forEach((group) => editableGroups.add(group));
  } else {
    const { data: memberships, error: membershipError } = await database
      .from("student_subjects")
      .select("group_code")
      .eq("student_id", session.studentId)
      .in("group_code", groups);
    if (membershipError) throw membershipError;
    memberships?.forEach((membership) => editableGroups.add(membership.group_code));
  }

  return timetable.map((row) => {
    const rotation = rotations?.find((item) => item.group_code === row.group);
    const update = updates?.find((item) => item.group_code === row.group && item.period === row.period);
    const joinedStudent = rotation?.students as unknown as { name: string } | null;
    return {
      ...row,
      selectedStudent: joinedStudent?.name ?? null,
      canEdit: canEditClass(session, editableGroups.has(row.group), row.section),
      update: update ? { covered: update.covered, homework: update.homework, absentNames: update.absent_names } : null,
      attachments: (attachments ?? [])
        .filter((attachment) => attachment.group_code === row.group && attachment.period === row.period)
        .map((attachment) => ({ id: attachment.id, kind: attachmentKindFromPath(attachment.storage_path) }))
    };
  });
}
