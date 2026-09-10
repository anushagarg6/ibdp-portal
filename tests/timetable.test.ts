import { describe, expect, it } from "vitest";
import { normalizeDate, normalizeSubject, parseSectionTimetableCsv, parseTimetableCsv, subjectToGroupCode } from "@/lib/timetable-parser";

describe("subject normalization", () => {
  it("normalizes all Physics variations to 'Physics'", () => {
    const physicsVariants = [
      "physics(a)-a",
      "physics (b) - a",
      "physics (a)- a",
      "Physics (b) - a",
      "physics",
      "Physics",
      "phy",
      "Phy",
      "Physics (A)",
      "Physics (B)",
      "Physics (A) - A",
      "Physics (B) - A",
      "Phy (a)-a"
    ];
    for (const variant of physicsVariants) {
      expect(normalizeSubject(variant)).toBe("Physics");
    }
  });

  it("normalizes general section annotations while preserving block codes", () => {
    expect(normalizeSubject("Business Management (A)")).toBe("Business Management");
    expect(normalizeSubject("Econ (B)")).toBe("Econ");
    expect(normalizeSubject("Visual Arts (B7)")).toBe("Visual Arts (B7)");
    expect(normalizeSubject("Hindi (B1)")).toBe("Hindi (B1)");
  });
});

describe("timetable CSV", () => {
  it("parses the documented format", () => {
    const rows = parseTimetableCsv("Date,Period,Subject,Group\n2026-09-09,1,Physics HL,PHY-HL\n09/09/2026,2,English SL,ENG-SL");
    expect(rows).toEqual([
      { date: "2026-09-09", period: "1", subject: "Physics HL", group: "PHY-HL" },
      { date: "2026-09-09", period: "2", subject: "English SL", group: "ENG-SL" }
    ]);
  });

  it("rejects ambiguous or malformed dates", () => {
    expect(normalizeDate("September 9")).toBeNull();
  });
});

describe("section A/B matrix timetable", () => {
  const csv = "A,B\nHomeroom,Homeroom\nPhysics,Math AA / Math AI\nBreak,Break\nEnglish A,English A\nReading time and reflection,Reading time and reflection";

  it("reads both sections, uses rows as periods, splits choices, and skips non-class rows", () => {
    expect(parseSectionTimetableCsv(csv, "2026-09-09")).toEqual([
      { date: "2026-09-09", period: "2", subject: "Physics · Section A", group: "PHYSICS-A", section: "A" },
      { date: "2026-09-09", period: "2", subject: "Math AA · Section B", group: "MATH-AA-B", section: "B" },
      { date: "2026-09-09", period: "2", subject: "Math AI · Section B", group: "MATH-AI-B", section: "B" },
      { date: "2026-09-09", period: "4", subject: "English A · Section A", group: "ENGLISH-A-A", section: "A" },
      { date: "2026-09-09", period: "4", subject: "English A · Section B", group: "ENGLISH-A-B", section: "B" }
    ]);
  });

  it("normalizes physics variants under section A and B in section timetable CSV", () => {
    const csvVariants = "A,B\nphysics(a)-a,physics (b) - b\nphysics (b) - a,physics (a) - b\nphy,Phy";
    const rows = parseSectionTimetableCsv(csvVariants, "2026-09-09");
    
    // Period 1
    expect(rows).toContainEqual({ date: "2026-09-09", period: "1", subject: "Physics · Section A", group: "PHYSICS-A", section: "A" });
    expect(rows).toContainEqual({ date: "2026-09-09", period: "1", subject: "Physics · Section B", group: "PHYSICS-B", section: "B" });
    
    // Period 2
    expect(rows).toContainEqual({ date: "2026-09-09", period: "2", subject: "Physics · Section A", group: "PHYSICS-A", section: "A" });
    expect(rows).toContainEqual({ date: "2026-09-09", period: "2", subject: "Physics · Section B", group: "PHYSICS-B", section: "B" });
    
    // Period 3
    expect(rows).toContainEqual({ date: "2026-09-09", period: "3", subject: "Physics · Section A", group: "PHYSICS-A", section: "A" });
    expect(rows).toContainEqual({ date: "2026-09-09", period: "3", subject: "Physics · Section B", group: "PHYSICS-B", section: "B" });
  });

  it("creates stable group codes from sheet labels", () => {
    expect(subjectToGroupCode("Business Management (B1)")).toBe("BUSINESS-MANAGEMENT-B1");
  });

  it("expands language acquisition into the five actual language groups", () => {
    const rows = parseSectionTimetableCsv("A,B\nLanguage acquisition,Language acquisition", "2026-09-09");
    expect(rows.map((row) => row.group)).toEqual([
      "FRENCH-AB-A", "FRENCH-B-A", "GERMAN-B-A", "GERMAN-AB-A", "HINDI-B-A",
      "FRENCH-AB-B", "FRENCH-B-B", "GERMAN-B-B", "GERMAN-AB-B", "HINDI-B-B"
    ]);
  });

  it("parses the supplied example sheet layout", () => {
    const example = "A,B\nHomeroom,Homeroom\nPhysics,Math AA / Math AI\nComputer science / chemistry,Computer science/Chemistry/Visual Arts (B7)/ Hindi (B1)/ Eco (B10)\nLanguage acquisition,Language acquisition\nBusiness Management (A)/DS,Econ (B)/ Business Management (B1)/ DS/ German B\nBreak,Break\nMath AA,Physics (B) / ESS / Psych (B9)\nEnglish A,English A\nMath AA,Math AA/ AI\nReading time and reflection,Reading time and reflection";
    const rows = parseSectionTimetableCsv(example, "2026-09-09");
    expect(rows).toHaveLength(35);
    expect(rows).toContainEqual({ date: "2026-09-09", period: "3", subject: "Visual Arts (B7) · Section B", group: "VISUAL-ARTS-B7-B", section: "B" });
    expect(rows.some((row) => row.subject.toLowerCase().includes("break"))).toBe(false);
  });
});
