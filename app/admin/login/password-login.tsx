"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";

export function PasswordLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "ورود ممکن نشد.");
      window.location.assign("/admin");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "ورود ممکن نشد.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="password-login-form" onSubmit={signIn}>
      <div className="login-security"><ShieldCheck size={18} /><span>ورود فقط برای مدیر تأییدشده</span></div>
      <label>
        <span>ایمیل مدیر</span>
        <div><Mail size={18} /><input type="email" required autoComplete="username" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      </label>
      <label>
        <span>رمز عبور</span>
        <div><KeyRound size={18} /><input type="password" required autoComplete="current-password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      </label>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" disabled={submitting}><LogIn size={18} />{submitting ? "در حال بررسی..." : "ورود به پنل مدیریت"}</button>
    </form>
  );
}
