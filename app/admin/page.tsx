import { getAuthorizedAdmin } from "@/lib/admin";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import Link from "next/link";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAuthorizedAdmin("/admin");
  if (!admin) {
    return (
      <main className="admin-access-denied">
        <div className="glass-regular">
          <img src="/brand/logo-burgundy.png" alt="Cookie Time" />
          <h1>دسترسی مدیریت فعال نیست</h1>
          <p>این حساب در فهرست مدیران Cookie Time قرار ندارد.</p>
          <a href={chatGPTSignOutPath("/admin")}>ورود با حساب دیگر</a>
          <Link href="/">بازگشت به فروشگاه</Link>
        </div>
      </main>
    );
  }

  return (
    <AdminDashboard
      adminName={admin.fullName ?? admin.displayName}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
