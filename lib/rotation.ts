import type { RotationEntry, Student } from "@/lib/types";

export function chooseLeastRecentlySelected(students: Student[], history: RotationEntry[], groupCode: string): Student | null {
  const eligible = students.filter((student) => student.groupCodes.includes(groupCode));
  if (!eligible.length) return null;

  const latest = new Map<string, number>();
  for (const entry of history) {
    if (entry.groupCode !== groupCode) continue;
    const timestamp = new Date(entry.selectedAt).getTime();
    latest.set(entry.studentId, Math.max(timestamp, latest.get(entry.studentId) ?? 0));
  }

  return [...eligible].sort((a, b) => {
    const timeDifference = (latest.get(a.id) ?? 0) - (latest.get(b.id) ?? 0);
    return timeDifference || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  })[0];
}
