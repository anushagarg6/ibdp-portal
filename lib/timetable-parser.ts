import { parse } from "csv-parse/sync";
import { z } from "zod";
import type { TimetableRow } from "@/lib/types";

const rowSchema = z.object({
  Date: z.string().trim().min(1),
  Period: z.string().trim().min(1),
  Subject: z.string().trim().min(1),
  Group: z.string().trim().min(1)
});

export function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return trimmed;
  const common = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(trimmed);
  if (!common) return null;
  const [, day, month, year] = common;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseTimetableCsv(csv: string): TimetableRow[] {
  const records: Record<string, string>[] = parse(csv, { columns: true, skip_empty_lines: true, bom: true, trim: true });
  const headers = records.length ? Object.keys(records[0]) : [];
  if (headers.includes("Date") && headers.includes("Period") && headers.includes("Subject") && headers.includes("Group")) {
    return parseRowTimetable(records);
  }
  throw new Error("Unsupported timetable format. Expected Date/Period/Subject/Group rows or A/B columns.");
}

function parseRowTimetable(records: Record<string, string>[]): TimetableRow[] {
  return records.map((record, index) => {
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) throw new Error(`Invalid timetable row ${index + 2}. Expected Date, Period, Subject, Group.`);
    const date = normalizeDate(parsed.data.Date);
    if (!date) throw new Error(`Invalid date in timetable row ${index + 2}: ${parsed.data.Date}`);
    return { date, period: parsed.data.Period, subject: parsed.data.Subject, group: parsed.data.Group };
  });
}

const ignoredSubjects = new Set(["break", "homeroom", "reading time and reflection"]);
const languageAcquisitionSubjects = ["French AB", "French B", "German B", "German AB", "Hindi B"];

export function parseSectionTimetableCsv(csv: string, date: string): TimetableRow[] {
  const records: Record<string, string>[] = parse(csv, { columns: true, skip_empty_lines: false, bom: true, trim: true });
  const headers = records.length ? Object.keys(records[0]).map((header) => header.trim().toUpperCase()) : [];
  if (!headers.includes("A") || !headers.includes("B")) throw new Error("Section timetable must have columns named A and B.");

  return records.flatMap((record, index) => (["A", "B"] as const).flatMap((section) => {
    const entry = Object.entries(record).find(([header]) => header.trim().toUpperCase() === section)?.[1] ?? "";
    return entry.split(/\s*\/\s*/)
      .map((subject) => subject.replace(/\s+/g, " ").trim())
      .filter((subject) => subject && !ignoredSubjects.has(subject.toLowerCase()))
      .flatMap((subject) => subject.toLowerCase() === "language acquisition" ? languageAcquisitionSubjects : [subject])
      .map((subject) => ({
        date,
        period: String(index + 1),
        subject: `${subject} · Section ${section}`,
        group: `${subjectToGroupCode(subject)}-${section}`,
        section
      }));
  }));
}

export function subjectToGroupCode(subject: string) {
  return subject.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/&/g, " AND ").replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
