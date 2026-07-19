import { createAdminSession, sessionCookie, verifyGoogleCredential } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { credential?: unknown };
    if (typeof body.credential !== "string" || !body.credential) {
      return jsonError("پاسخ ورود گوگل معتبر نیست.", 400);
    }
    const user = await verifyGoogleCredential(body.credential);
    const token = await createAdminSession(user);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": sessionCookie(token, secure),
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ورود ممکن نشد.", 403);
  }
}
