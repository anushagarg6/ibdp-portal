"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ClassItem = {
  date: string;
  period: string;
  subject: string;
  group: string;
  selectedStudent: string | null;
  selectedStudentId?: string | null;
  canEdit: boolean;
  canReassign?: boolean;
  enrolledStudents?: { id: string; name: string }[];
  update: { covered: string; homework: string; absentNames: string } | null;
  attachments: { id: string; kind: "image" | "pdf" | "word" }[];
};

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export default function Dashboard() {
  const [date, setDate] = useState(localDate);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [viewer, setViewer] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (chosenDate: string) => {
    setLoading(true);
    const response = await fetch(`/api/day?date=${encodeURIComponent(chosenDate)}`);
    if (response.status === 401) return window.location.reload();
    const data = await response.json();
    setItems(data.classes ?? []);
    setViewer(data.viewer?.label ?? "");
    setLoading(false);
  }, []);

  useEffect(() => { void load(date); }, [date, load]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="logo-frame">
            <Image className="school-logo" src="/dps-rk-puram-logo.png" alt="Delhi Public School R.K. Puram" width={361} height={133} priority />
          </div>
          <div className="brand-copy">
            <div className="brand">IBDP Portal</div>
            <div className="brand-subtitle">IB Diploma Programme</div>
            {viewer && <div className="meta">Signed in as {viewer}</div>}
          </div>
        </div>
        <button className="button secondary" onClick={logout}>Sign out</button>
      </header>
      <section className="hero">
        <h1>Class updates</h1>
        <p className="lede">View classwork, homework, and absences for your section. Students enrolled in a subject can add or edit its update.</p>
      </section>
      <div className="date-row">
        <label htmlFor="date"><strong>School day</strong></label>
        <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      {loading ? <div className="empty">Loading classes…</div> : items.length ? (
        <section className="grid">
          {items.map((item) => <ClassCard key={`${item.date}-${item.group}-${item.period}`} item={item} onSaved={() => load(date)} />)}
        </section>
      ) : <div className="empty">No classes are listed for this date. Check the timetable sheet or choose another day.</div>}
    </main>
  );
}

function ClassCard({ item, onSaved }: { item: ClassItem; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/updates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: item.date,
        period: item.period,
        group: item.group,
        covered: form.get("covered"),
        homework: form.get("homework"),
        absentNames: form.get("absentNames")
      })
    });
    setBusy(false);
    if (response.ok) { setMessage("Saved"); onSaved(); }
    else setMessage("Could not save. Please try again.");
  }

  async function handleReassign(targetStudentId: string) {
    setReassignBusy(true);
    setMessage("");
    const response = await fetch("/api/reassign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: item.date,
        group: item.group,
        studentId: targetStudentId
      })
    });
    const data = await response.json().catch(() => ({}));
    setReassignBusy(false);
    if (response.ok) {
      setMessage(`Reassigned lead to ${data.studentName ?? "student"}`);
      onSaved();
    } else {
      setMessage(typeof data.error === "string" ? data.error : "Could not reassign lead.");
    }
  }

  async function uploadAttachment() {
    if (!attachment) return;
    setUploadBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("date", item.date);
    body.set("period", item.period);
    body.set("group", item.group);
    body.set("file", attachment);
    const response = await fetch("/api/attachments", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    setUploadBusy(false);
    if (response.ok) {
      setAttachment(null);
      setMessage("File uploaded");
      onSaved();
    } else {
      setMessage(typeof data.error === "string" ? data.error : "Could not upload file.");
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <div className="card-head">
        <div>
          <h2>{item.subject}</h2>
          <div className="meta">Period {item.period} · {item.group}</div>
        </div>
        <div className="badge-block">
          <span className="badge">{item.selectedStudent ? `${item.selectedStudent} updates` : "Awaiting assignment"}</span>
          {item.canReassign && item.enrolledStudents && item.enrolledStudents.length > 0 && (
            <div className="reassign-control">
              <label htmlFor={`reassign-${item.group}-${item.period}`} className="sr-only">Reassign lead</label>
              <select
                id={`reassign-${item.group}-${item.period}`}
                className="reassign-select"
                disabled={reassignBusy}
                value={item.selectedStudentId ?? ""}
                onChange={(event) => {
                  if (event.target.value && event.target.value !== (item.selectedStudentId ?? "")) {
                    void handleReassign(event.target.value);
                  }
                }}
              >
                <option value="" disabled>Reassign lead to…</option>
                {item.enrolledStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.id === item.selectedStudentId ? "(Current lead)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="fields">
        <label className="field full">What was covered?<textarea name="covered" maxLength={2000} defaultValue={item.update?.covered ?? ""} readOnly={!item.canEdit} placeholder={item.canEdit ? "Add the topics and work completed" : "No update yet"} /></label>
        <label className="field">Homework<input name="homework" maxLength={1000} defaultValue={item.update?.homework ?? ""} readOnly={!item.canEdit} placeholder={item.canEdit ? "Add homework" : "No homework added"} /></label>
        <label className="field">Who was absent?<input name="absentNames" maxLength={500} defaultValue={item.update?.absentNames ?? ""} readOnly={!item.canEdit} placeholder={item.canEdit ? "Leave blank if everyone attended" : "No absences added"} /></label>
      </div>
      {item.attachments.length > 0 && (
        <div className="attachment-list">
          {item.attachments.map((attachment, index) => (
            <a key={attachment.id} href={`/api/attachments/${attachment.id}`} target="_blank" rel="noreferrer" className={`attachment-link ${attachment.kind === "image" ? "" : "document"}`}>
              {attachment.kind === "image"
                ? <Image src={`/api/attachments/${attachment.id}`} alt={`Classwork picture ${index + 1}`} width={180} height={120} unoptimized />
                : <><span className="document-icon" aria-hidden="true">{attachment.kind === "pdf" ? "PDF" : "DOCX"}</span><span>{attachment.kind === "pdf" ? "Open PDF" : "Download Word file"}</span></>}
            </a>
          ))}
        </div>
      )}
      {item.canEdit && item.attachments.length < 3 && (
        <div className="upload-row">
          <label className="upload-label">
            Attach a picture or document
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="button secondary" type="button" disabled={!attachment || uploadBusy} onClick={uploadAttachment}>
            {uploadBusy ? "Uploading…" : "Upload file"}
          </button>
        </div>
      )}
      <div className="actions">
        {item.canEdit
          ? <button className="button" disabled={busy}>{busy ? "Saving…" : item.update ? "Update notes" : "Save notes"}</button>
          : <span className="status">View only · not enrolled in this subject</span>}
        {message && <span className="status">{message}</span>}
      </div>
    </form>
  );
}
