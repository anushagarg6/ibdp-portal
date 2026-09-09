import type { Session } from "@/lib/types";

export function canViewClass(session: Session, section?: "A" | "B") {
  return session.role === "teacher" || !section || session.section === section;
}

export function canEditClass(session: Session, isSubjectMember: boolean, section?: "A" | "B") {
  return session.role === "teacher" || (session.section === section && isSubjectMember);
}
