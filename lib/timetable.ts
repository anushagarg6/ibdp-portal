import "server-only";
import { env } from "@/lib/env";
import { parseSectionTimetableCsv, parseTimetableCsv } from "@/lib/timetable-parser";
import { db } from "@/lib/db";
import type { TimetableRow } from "@/lib/types";

function getTodayInAppTimeZone(): string {
  const timeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return formatter.format(new Date());
}

export async function getTimetable(date: string): Promise<TimetableRow[]> {
  const database = db();
  const todayStr = getTodayInAppTimeZone();

  // -------------------------------------------------------------
  // 1. PAST DATES (date < todayStr): ONLY use saved DB snapshots or historical records.
  //    NEVER fetch live Google Sheets matrix for a past date!
  // -------------------------------------------------------------
  if (date < todayStr) {
    try {
      const { data: savedRows, error } = await database
        .from("daily_timetable")
        .select("class_date, period, subject, group_code, section")
        .eq("class_date", date)
        .order("period");

      const { data: rotRows } = await database
        .from("rotation_history")
        .select("group_code")
        .eq("class_date", date);

      const rotGroups = new Set((rotRows ?? []).map((r) => r.group_code));
      const { data: updateRows } = await database
        .from("class_updates")
        .select("period, group_code")
        .eq("class_date", date);

      const updateGroups = new Set((updateRows ?? []).map((u) => u.group_code));

      if (!error && savedRows && savedRows.length > 0) {
        return savedRows.map((r) => ({
          date: r.class_date,
          period: String(r.period),
          subject: r.subject,
          group: r.group_code,
          section: (r.section as "A" | "B") ?? undefined
        }));
      }

      // Reconstruct timetable from rotation_history and class_updates for this past date
      const groupPeriods = new Map<string, string>();
      for (const u of updateRows ?? []) {
        groupPeriods.set(u.group_code, String(u.period));
      }
      for (const r of rotRows ?? []) {
        if (!groupPeriods.has(r.group_code)) {
          groupPeriods.set(r.group_code, "1");
        }
      }

      if (groupPeriods.size > 0) {
        const groupCodes = Array.from(groupPeriods.keys());
        const { data: subjectGroups } = await database
          .from("subject_groups")
          .select("code, display_name")
          .in("code", groupCodes);

        const nameMap = new Map((subjectGroups ?? []).map((g) => [g.code, g.display_name]));

        const reconstructedRows: TimetableRow[] = groupCodes.map((code) => {
          const subject = nameMap.get(code) ?? code;
          const section = code.endsWith("-B") ? "B" : code.endsWith("-A") ? "A" : undefined;
          return {
            date,
            period: groupPeriods.get(code) ?? "1",
            subject,
            group: code,
            section
          };
        });

        // Save reconstructed snapshot so future lookups for this past date are fast & permanent
        try {
          const records = reconstructedRows.map((r) => ({
            class_date: date,
            period: r.period,
            subject: r.subject,
            group_code: r.group,
            section: r.section ?? null
          }));
          await database.from("daily_timetable").upsert(records, { onConflict: "class_date,period,group_code" });
        } catch {
          // Non-blocking fallback
        }

        return reconstructedRows;
      }
    } catch {
      // Non-blocking
    }

    // Return empty array for past dates that have no recorded schedule or updates
    return [];
  }

  // -------------------------------------------------------------
  // 2. TODAY OR FUTURE DATES (date >= todayStr): Fetch live CSV from Google Sheets
  // -------------------------------------------------------------
  let rows: TimetableRow[] = [];
  try {
    const config = env();
    const response = await fetch(config.TIMETABLE_CSV_URL, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (response.ok) {
      const csv = await response.text();
      try {
        rows = parseTimetableCsv(csv).filter((row) => row.date === date);
      } catch (error) {
        if (error instanceof Error && error.message.includes("A/B columns")) {
          rows = parseSectionTimetableCsv(csv, date);
        }
      }
    }
  } catch {
    // Non-blocking fallback if fetch fails
  }

  // Snapshot today's timetable into daily_timetable table in Supabase
  if (rows.length > 0) {
    try {
      const uniqueGroups = Array.from(
        new Map(rows.map((r) => [r.group, { code: r.group, display_name: r.subject }])).values()
      );
      await database.from("subject_groups").upsert(uniqueGroups, { onConflict: "code" });

      const records = rows.map((r) => ({
        class_date: date,
        period: r.period,
        subject: r.subject,
        group_code: r.group,
        section: r.section ?? null
      }));

      await database.from("daily_timetable").upsert(records, { onConflict: "class_date,period,group_code" });
    } catch {
      // Non-blocking fallback
    }
  }

  return rows;
}
