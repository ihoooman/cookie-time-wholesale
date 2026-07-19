import { clearSessionCookie } from "@/lib/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = Response.redirect(new URL("/", url), 302);
  response.headers.set("Set-Cookie", clearSessionCookie(url.protocol === "https:"));
  return response;
}
