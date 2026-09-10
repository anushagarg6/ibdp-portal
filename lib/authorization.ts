import type { Session } from "@/lib/types";

export function canViewClass(session: Session, section?: "A" | "B") {
  return session.role === "teacher" || !section || session.section === section;
}

export function canEditClass(session: Session, isSubjectMember: boolean, section?: "A" | "B") {
  return session.role === "teacher" || (session.section === section && isSubjectMember);
}

export function canReassignClass(session: Session, isSubjectMember: boolean, assignedStudentId: string | null, section?: "A" | "B") {
  if (session.role === "teacher") return true;
  if (session.section !== section || !isSubjectMember) return false;
  if (!assignedStudentId) return true;
  return session.studentId === assignedStudentId;
}
