"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentName: form.get("studentName"), accessCode: form.get("accessCode") })
    });
    setBusy(false);
    if (response.ok) window.location.reload();
    else setError(response.status === 429 ? "Too many attempts. Try again later." : "That access code is not correct.");
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <Image className="school-logo" src="/dps-rk-puram-logo.png" alt="Delhi Public School R.K. Puram" width={361} height={133} priority />
          <div className="programme-mark">IB Diploma<br />Programme</div>
        </div>
        <div className="login-content">
          <h1>IBDP Portal</h1>
          <p className="lede">Students sign in with their name and personal code. Teachers can leave the name blank and use the teacher code.</p>
          <label className="field">
            Student name
            <input name="studentName" type="text" autoComplete="username" maxLength={100} placeholder="Leave blank for teacher" />
          </label>
          <label className="field">
            Personal access code
            <input name="accessCode" type="password" autoComplete="current-password" minLength={8} maxLength={128} required />
          </label>
          <div className="actions">
            <button className="button" disabled={busy}>{busy ? "Checking…" : "Enter portal"}</button>
            {error && <span className="error">{error}</span>}
          </div>
        </div>
      </form>
    </main>
  );
}
