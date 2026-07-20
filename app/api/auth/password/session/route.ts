import {
  clearPasswordLoginFailures,
  createAdminSession,
  passwordLoginAllowed,
  recordPasswordLoginFailure,
  sessionCookie,
  verifyPasswordCredential,
} from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await passwordLoginAllowed(request))) {
    return new Response(JSON.stringify({ error: "تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه دیگر دوباره امتحان کنید." }), {
      status: 429,
      headers: { "Content-Type": "application/json; charset=utf-8", "Retry-After": "900" },
    });
  }

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string" || !body.email || !body.password) {
      return jsonError("ایمیل و رمز عبور را وارد کنید.", 400);
    }
    const user = await verifyPasswordCredential(body.email, body.password);
    await clearPasswordLoginFailures(request);
    const token = await createAdminSession(user);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ user: { email: user.email, displayName: user.displayName } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": sessionCookie(token, secure),
      },
    });
  } catch (error) {
    await recordPasswordLoginFailure(request);
    const message = error instanceof Error && error.message.includes("تنظیم نشده")
      ? error.message
      : "ایمیل یا رمز عبور صحیح نیست.";
    return jsonError(message, 403);
  }
}
