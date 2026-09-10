export type TimetableRow = { date: string; period: string; subject: string; group: string; section?: "A" | "B" };
export type Student = { id: string; name: string; groupCodes: string[] };
export type RotationEntry = { studentId: string; groupCode: string; selectedAt: string };
export type Session =
  | { role: "teacher"; exp: number }
  | { role: "student"; exp: number; studentId: string; studentName: string; section: "A" | "B" };

export type EnrolledStudent = { id: string; name: string };
