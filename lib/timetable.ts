import "server-only";
import { env } from "@/lib/env";
import { parseSectionTimetableCsv, parseTimetableCsv } from "@/lib/timetable-parser";

export async function getTimetable(date: string) {
  const config = env();
  const response = await fetch(config.TIMETABLE_CSV_URL, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Timetable fetch failed (${response.status})`);
  const csv = await response.text();
  try {
    return parseTimetableCsv(csv).filter((row) => row.date === date);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("A/B columns")) throw error;
    return parseSectionTimetableCsv(csv, date);
  }
}
