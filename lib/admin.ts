import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

const ADMIN_EMAIL = "hoomihooman@gmail.com";
const SESSION_COOKIE = "cookie_time_admin";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type AdminUser = {
  email: string;
  displayName: string;
  picture?: string;
};

const LOCAL_ADMIN: AdminUser = {
  email: ADMIN_EMAIL,
  displayName: "مدیر محلی",
};

function runtimeEnv(): { GOOGLE_CLIENT_ID?: string; AUTH_SECRET?: string } {
  return env as unknown as { GOOGLE_CLIENT_ID?: string; AUTH_SECRET?: string };
}

function authSecret(): Uint8Array {
  const configured = runtimeEnv().AUTH_SECRET;
  if (configured && configured.length >= 32) return new TextEncoder().encode(configured);
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode("cookie-time-local-development-secret-2026");
  }
  throw new Error("AUTH_SECRET تنظیم نشده است.");
}

export function getGoogleClientId(): string | null {
  return runtimeEnv().GOOGLE_CLIENT_ID?.trim() || null;
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function verifyGoogleCredential(credential: string): Promise<AdminUser> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("ورود گوگل هنوز تنظیم نشده است.");
  const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
    audience: clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  if (payload.email_verified !== true || !isAdminEmail(email)) {
    throw new Error("این حساب اجازه ورود به پنل Cookie Time را ندارد.");
  }
  return {
    email,
    displayName: typeof payload.name === "string" ? payload.name : "مدیر Cookie Time",
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

export async function createAdminSession(user: AdminUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.displayName, picture: user.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.email)
    .setIssuer("cookie-time")
    .setAudience("cookie-time-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(authSecret());
}

async function verifyAdminSession(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret(), {
      issuer: "cookie-time",
      audience: "cookie-time-admin",
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!isAdminEmail(email)) return null;
    return {
      email,
      displayName: typeof payload.name === "string" ? payload.name : "مدیر Cookie Time",
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, secure = true): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure = true): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function getAuthorizedAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) return verifyAdminSession(token);
  if (process.env.NODE_ENV === "development") return LOCAL_ADMIN;
  return null;
}

export async function isAuthorizedAdminRequest(): Promise<boolean> {
  return Boolean(await getAuthorizedAdmin());
}
