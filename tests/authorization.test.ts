import { describe, expect, it } from "vitest";
import { canEditClass, canReassignClass, canViewClass } from "@/lib/authorization";

const teacher = { role: "teacher" as const, exp: 9999999999 };
const asha = { role: "student" as const, exp: 9999999999, studentId: "asha", studentName: "Asha", section: "A" as const };
const ben = { role: "student" as const, exp: 9999999999, studentId: "ben", studentName: "Ben", section: "A" as const };

describe("class authorization", () => {
  it("lets students view only their section", () => {
    expect(canViewClass(asha, "A")).toBe(true);
    expect(canViewClass(asha, "B")).toBe(false);
  });

  it("lets any student enrolled in the subject edit within their section", () => {
    expect(canEditClass(asha, true, "A")).toBe(true);
    expect(canEditClass(ben, true, "A")).toBe(true);
    expect(canEditClass(asha, false, "A")).toBe(false);
    expect(canEditClass(asha, true, "B")).toBe(false);
  });

  it("lets the teacher view and edit both sections", () => {
    expect(canViewClass(teacher, "B")).toBe(true);
    expect(canEditClass(teacher, false, "B")).toBe(true);
  });

  it("controls lead reassignment permissions correctly", () => {
    // Assigned student Asha can reassign her lead position
    expect(canReassignClass(asha, true, "asha", "A")).toBe(true);
    // Unassigned student Ben cannot reassign Asha's lead position
    expect(canReassignClass(ben, true, "asha", "A")).toBe(false);
    // If no one is assigned yet, enrolled student Asha or Ben can set the lead
    expect(canReassignClass(ben, true, null, "A")).toBe(true);
    // Student not in subject cannot reassign
    expect(canReassignClass(ben, false, null, "A")).toBe(false);
    // Teacher can reassign anytime
    expect(canReassignClass(teacher, false, "asha", "A")).toBe(true);
  });
});
