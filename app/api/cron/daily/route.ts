import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { dateInTimeZone } from "@/lib/date";
import { getTimetable } from "@/lib/timetable";
import { chooseLeastRecentlySelected } from "@/lib/rotation";
import type { RotationEntry, Student } from "@/lib/types";

export const maxDuration = 30;

export async function GET(request: Request) {
  const config = env();
  if (request.headers.get("authorization") !== `Bearer ${config.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = dateInTimeZone(config.APP_TIME_ZONE);
  const database = db();
  const { error: claimError } = await database.from("daily_runs").insert({ class_date: date, status: "processing" });
  if (claimError?.code === "23505") {
    const { data: run } = await database.from("daily_runs").select("status").eq("class_date", date).single();
    if (run?.status === "failed") {
      const { data: claimedRetry, error: retryError } = await database.from("daily_runs")
        .update({ status: "processing", error_message: null, started_at: new Date().toISOString(), finished_at: null })
        .eq("class_date", date)
        .eq("status", "failed")
        .select("class_date")
        .maybeSingle();
      if (retryError) throw retryError;
      if (!claimedRetry) return NextResponse.json({ ok: true, message: "Already processing" });
    } else {
      return NextResponse.json({ ok: true, message: run?.status === "sent" ? "Already sent" : run?.status === "no_classes" ? "No classes today" : "Already processing" });
    }
  }
  if (claimError && claimError.code !== "23505") throw claimError;

  try {
    const classes = await getTimetable(date);
    const groups = [...new Set(classes.map((item) => item.group))];
    if (!groups.length) {
      await database.from("daily_runs").update({ status: "no_classes", finished_at: new Date().toISOString() }).eq("class_date", date);
      return NextResponse.json({ ok: true, message: "No classes today" });
    }

    const { error: groupError } = await database.from("subject_groups").upsert(
      groups.map((group) => ({ code: group, display_name: classes.find((item) => item.group === group)?.subject ?? group })),
      { onConflict: "code" }
    );
    if (groupError) throw groupError;

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
    const history: RotationEntry[] = (historyRows ?? []).map((row) => ({ studentId: row.student_id, groupCode: row.group_code, selectedAt: row.selected_at }));
    const selections = groups.map((group) => {
      const existing = existingRotations?.find((rotation) => rotation.group_code === group);
      return { group, student: existing ? studentMap.get(existing.student_id) ?? null : chooseLeastRecentlySelected([...studentMap.values()], history, group), existing: Boolean(existing) };
    });
    const newSelections = selections.filter((selection) => !selection.existing && selection.student);
    if (newSelections.length) {
      const { error: insertError } = await database.from("rotation_history").insert(newSelections.map(({ group, student }) => ({ class_date: date, group_code: group, student_id: student!.id })));
      if (insertError) throw insertError;
    }

    const rows = classes.map((item) => {
      const name = selections.find((selection) => selection.group === item.group)?.student?.name ?? "Unassigned";
      return `<tr><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(item.period)}</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(item.subject)}</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(item.group)}</td><td style="padding:10px;border-bottom:1px solid #ddd"><strong>${escapeHtml(name)}</strong></td></tr>`;
    }).join("");
    const resend = new Resend(config.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: config.EMAIL_FROM,
      to: config.EMAIL_TO,
      subject: `Class follow-ups for ${date}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#102a43"><h1>Today's class follow-ups</h1><p>These students are today's leads. If a lead is absent, any student enrolled in that subject can add or edit the update.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left" style="padding:10px">Period</th><th align="left" style="padding:10px">Subject</th><th align="left" style="padding:10px">Group</th><th align="left" style="padding:10px">Student</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:24px"><a href="${escapeHtml(config.APP_URL)}" style="background:#0b5cab;color:white;padding:12px 18px;border-radius:999px;text-decoration:none">Open class updates</a></p></div>`
    }, { idempotencyKey: `daily-class-follow-up-${date}` });
    if (emailError) throw new Error(`Resend: ${emailError.message}`);

    await database.from("daily_runs").update({ status: "sent", finished_at: new Date().toISOString() }).eq("class_date", date);
    return NextResponse.json({
      ok: true,
      date,
      classCount: classes.length,
      assignedGroupCount: selections.filter((selection) => selection.student).length,
      unassignedGroups: selections.filter((selection) => !selection.student).map((selection) => selection.group)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily follow-up failed", message);
    await database.from("daily_runs").update({ status: "failed", error_message: message.slice(0, 500), finished_at: new Date().toISOString() }).eq("class_date", date);
    return NextResponse.json({ error: "Daily follow-up failed" }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}
