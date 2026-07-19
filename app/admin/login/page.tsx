import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { getAuthorizedAdmin } from "@/lib/admin";
import { GoogleLogin } from "./google-login";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (process.env.NODE_ENV !== "development" && await getAuthorizedAdmin()) redirect("/admin");
  return (
    <main className="admin-login-page">
      <Link className="login-back" href="/"><ArrowRight size={18} /> بازگشت به سفارش عمده</Link>
      <section className="admin-login-card liquid-clear">
        <img src="/brand/logo-burgundy.png" alt="Cookie Time" />
        <span className="login-icon"><LockKeyhole size={24} /></span>
        <p className="eyebrow dark">پنل مدیریت همکاری</p>
        <h1>ورود مدیر Cookie Time</h1>
        <p>برای مدیریت محصولات و سفارش‌های عمده با حساب Google مجاز وارد شوید.</p>
        <GoogleLogin />
      </section>
    </main>
  );
}
