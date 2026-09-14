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

  // 1. If viewing a past date, first attempt to read from daily_timetable snapshot in Supabase
  if (date < todayStr) {
    try {
      const { data: savedRows, error } = await database
        .from("daily_timetable")
        .select("class_date, period, subject, group_code, section")
        .eq("class_date", date)
        .order("period");

      if (!error && savedRows && savedRows.length > 0) {
        return savedRows.map((r) => ({
          date: r.class_date,
          period: String(r.period),
          subject: r.subject,
          group: r.group_code,
          section: (r.section as "A" | "B") ?? undefined
        }));
      }
    } catch {
      // Proceed if table lookup fails
    }
  }

  // 2. Fetch live CSV from Google Sheets
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
    // If Google Sheet fetch fails, rows remains empty
  }

  // 3. For past dates, if live Google Sheet was overwritten/deleted, reconstruct missing past classes from class_updates
  if (date < todayStr) {
    try {
      const { data: pastUpdates } = await database
        .from("class_updates")
        .select("period, group_code")
        .eq("class_date", date);

      if (pastUpdates && pastUpdates.length > 0) {
        const existingGroupPeriods = new Set(rows.map((r) => `${r.period}:${r.group}`));
        const missingGroupCodes = [...new Set(pastUpdates.filter((u) => !existingGroupPeriods.has(`${u.period}:${u.group_code}`)).map((u) => u.group_code))];

        if (missingGroupCodes.length > 0) {
          const { data: subjectGroups } = await database
            .from("subject_groups")
            .select("code, display_name")
            .in("code", missingGroupCodes);

          const nameMap = new Map((subjectGroups ?? []).map((g) => [g.code, g.display_name]));

          for (const u of pastUpdates) {
            const key = `${u.period}:${u.group_code}`;
            if (!existingGroupPeriods.has(key)) {
              existingGroupPeriods.add(key);
              const subjectName = nameMap.get(u.group_code) ?? u.group_code;
              const section = u.group_code.endsWith("-B") ? "B" : u.group_code.endsWith("-A") ? "A" : undefined;
              rows.push({
                date,
                period: String(u.period),
                subject: subjectName,
                group: u.group_code,
                section
              });
            }
          }
        }
      }
    } catch {
      // Proceed with current rows if historical reconstruction fails
    }
  }

  // 4. Save/update snapshot in daily_timetable in Supabase so historical schedule stays frozen and preserved
  if (rows.length > 0) {
    try {
      // Ensure subject groups exist for foreign key constraints
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
      // Ignore upsert error if table is not yet migrated in Supabase
    }
  }

  return rows;
}
