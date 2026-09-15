import "server-only";
import { db } from "@/lib/db";
import { chooseLeastRecentlySelected } from "@/lib/rotation";
import type { RotationEntry, Student } from "@/lib/types";

export async function ensureDailyRotations(date: string, groups: string[]): Promise<void> {
  if (!groups.length) return;
  const database = db();

  const [
    { data: memberships, error: membershipError },
    { data: historyRows, error: historyError },
    { data: existingRotations, error: existingRotationError }
  ] = await Promise.all([
    database.from("student_subjects").select("group_code, students(id,name,active)").in("group_code", groups),
    database.from("rotation_history").select("student_id,group_code,selected_at").in("group_code", groups).lt("class_date", date).order("selected_at", { ascending: false }).limit(1000),
    database.from("rotation_history").select("student_id,group_code").eq("class_date", date).in("group_code", groups)
  ]);

  if (membershipError) throw membershipError;
  if (historyError) throw historyError;
  if (existingRotationError) throw existingRotationError;

  const studentMap = new Map<string, Student>();
  for (const membership of memberships ?? []) {
    const student = membership.students as unknown as { id: string; name: string; active: boolean } | null;
    if (!student?.active) continue;
    const existing = studentMap.get(student.id) ?? { id: student.id, name: student.name, groupCodes: [] };
    existing.groupCodes.push(membership.group_code);
    studentMap.set(student.id, existing);
  }

  const history: RotationEntry[] = (historyRows ?? []).map((row) => ({
    studentId: row.student_id,
    groupCode: row.group_code,
    selectedAt: row.selected_at
  }));

  const selections = groups.map((group) => {
    const existing = existingRotations?.find((rotation) => rotation.group_code === group);
    return {
      group,
      student: existing ? studentMap.get(existing.student_id) ?? null : chooseLeastRecentlySelected([...studentMap.values()], history, group),
      existing: Boolean(existing)
    };
  });

  const newSelections = selections.filter((selection) => !selection.existing && selection.student);
  if (newSelections.length > 0) {
    const { error: insertError } = await database
      .from("rotation_history")
      .insert(newSelections.map(({ group, student }) => ({ class_date: date, group_code: group, student_id: student!.id })));
    if (insertError) throw insertError;
  }
}
