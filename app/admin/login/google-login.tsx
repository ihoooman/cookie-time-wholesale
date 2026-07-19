"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
};

declare global {
  interface Window { google?: GoogleIdentity }
}

export function GoogleLogin() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("در حال آماده‌سازی ورود امن...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        const configResponse = await fetch("/api/auth/google/config", { cache: "no-store" });
        const config = (await configResponse.json()) as { clientId?: string; error?: string };
        if (!configResponse.ok || !config.clientId) throw new Error(config.error || "تنظیمات ورود در دسترس نیست.");

        const handleCredential = async (response: GoogleCredentialResponse) => {
          if (!response.credential) return setError("پاسخ گوگل کامل نبود.");
          setStatus("در حال بررسی حساب...");
          setError("");
          const sessionResponse = await fetch("/api/auth/google/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });
          const session = (await sessionResponse.json()) as { error?: string };
          if (!sessionResponse.ok) {
            setStatus("");
            return setError(session.error || "این حساب اجازه ورود ندارد.");
          }
          window.location.assign("/admin");
        };

        const initialize = () => {
          if (cancelled || !window.google || !buttonRef.current) return;
          window.google.accounts.id.initialize({ client_id: config.clientId!, callback: handleCredential, auto_select: false });
          buttonRef.current.replaceChildren();
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            logo_alignment: "left",
            width: 320,
          });
          setStatus("");
        };

        if (window.google) return initialize();
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initialize;
        script.onerror = () => setError("ارتباط با سرویس ورود گوگل برقرار نشد.");
        document.head.appendChild(script);
      } catch (setupError) {
        if (!cancelled) {
          setStatus("");
          setError(setupError instanceof Error ? setupError.message : "ورود آماده نشد.");
        }
      }
    }
    void setup();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="google-login-block">
      <div className="login-security"><ShieldCheck size={18} /><span>ورود فقط برای حساب مدیر تأییدشده</span></div>
      <div ref={buttonRef} className="google-button-slot" />
      {status && <p>{status}</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  );
}
