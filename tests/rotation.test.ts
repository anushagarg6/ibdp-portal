import { describe, expect, it } from "vitest";
import { chooseLeastRecentlySelected } from "@/lib/rotation";

const students = [
  { id: "1", name: "Asha", groupCodes: ["PHY-HL"] },
  { id: "2", name: "Ben", groupCodes: ["PHY-HL"] },
  { id: "3", name: "Cara", groupCodes: ["ENG-SL"] }
];

describe("least-recently-selected rotation", () => {
  it("chooses an eligible student who has never been selected", () => {
    const chosen = chooseLeastRecentlySelected(students, [{ studentId: "1", groupCode: "PHY-HL", selectedAt: "2026-09-01T00:00:00Z" }], "PHY-HL");
    expect(chosen?.name).toBe("Ben");
  });

  it("chooses the student selected longest ago", () => {
    const chosen = chooseLeastRecentlySelected(students, [
      { studentId: "1", groupCode: "PHY-HL", selectedAt: "2026-09-01T00:00:00Z" },
      { studentId: "2", groupCode: "PHY-HL", selectedAt: "2026-09-05T00:00:00Z" }
    ], "PHY-HL");
    expect(chosen?.name).toBe("Asha");
  });

  it("never selects a student outside the group", () => {
    expect(chooseLeastRecentlySelected(students, [], "ENG-SL")?.name).toBe("Cara");
    expect(chooseLeastRecentlySelected(students, [], "MATH-HL")).toBeNull();
  });
});
