import { getAuthorizedAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAuthorizedAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <AdminDashboard
      adminName={admin.displayName}
      signOutPath="/api/auth/google/logout"
    />
  );
}
