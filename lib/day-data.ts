import "server-only";
import { db } from "@/lib/db";
import { getTimetable } from "@/lib/timetable";
import type { Session, EnrolledStudent } from "@/lib/types";
import { canEditClass, canReassignClass, canViewClass } from "@/lib/authorization";
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
    { data: attachments, error: attachmentError },
    { data: memberships, error: membershipError }
  ] = await Promise.all([
    database.from("rotation_history").select("student_id, group_code, students(name)").eq("class_date", date).in("group_code", groups),
    database.from("class_updates").select("period, group_code, covered, homework, absent_names").eq("class_date", date).in("group_code", groups),
    database.from("class_update_attachments").select("id, period, group_code, storage_path").eq("class_date", date).in("group_code", groups).order("created_at"),
    database.from("student_subjects").select("group_code, students(id, name, active)").in("group_code", groups)
  ]);
  if (rotationError) throw rotationError;
  if (updateError) throw updateError;
  if (attachmentError) throw attachmentError;
  if (membershipError) throw membershipError;

  const editableGroups = new Set<string>();
  const enrolledByGroup = new Map<string, EnrolledStudent[]>();

  for (const membership of memberships ?? []) {
    const s = membership.students as unknown as { id: string; name: string; active: boolean } | null;
    if (!s?.active) continue;
    if (session.role === "student" && s.id === session.studentId) {
      editableGroups.add(membership.group_code);
    }
    const list = enrolledByGroup.get(membership.group_code) ?? [];
    if (!list.some((item) => item.id === s.id)) {
      list.push({ id: s.id, name: s.name });
    }
    enrolledByGroup.set(membership.group_code, list);
  }

  if (session.role === "teacher") {
    groups.forEach((group) => editableGroups.add(group));
  }

  enrolledByGroup.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

  return timetable.map((row) => {
    const rotation = rotations?.find((item) => item.group_code === row.group);
    const update = updates?.find((item) => item.group_code === row.group && item.period === row.period);
    const joinedStudent = rotation?.students as unknown as { name: string } | null;
    const isSubjectMember = editableGroups.has(row.group);
    const selectedStudentId = rotation?.student_id ?? null;
    const enrolledStudents = enrolledByGroup.get(row.group) ?? [];

    return {
      ...row,
      selectedStudent: joinedStudent?.name ?? null,
      selectedStudentId,
      canEdit: canEditClass(session, isSubjectMember, row.section),
      canReassign: canReassignClass(session, isSubjectMember, selectedStudentId, row.section),
      enrolledStudents,
      update: update ? { covered: update.covered, homework: update.homework, absentNames: update.absent_names } : null,
      attachments: (attachments ?? [])
        .filter((attachment) => attachment.group_code === row.group && attachment.period === row.period)
        .map((attachment) => ({ id: attachment.id, kind: attachmentKindFromPath(attachment.storage_path) }))
    };
  });
}
