import { getGoogleClientId } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return Response.json({ error: "ورود گوگل هنوز تنظیم نشده است." }, { status: 503 });
  }
  return Response.json({ clientId });
}
