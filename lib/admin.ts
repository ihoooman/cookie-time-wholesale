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

function runtimeEnv(): {
  GOOGLE_CLIENT_ID?: string;
  AUTH_SECRET?: string;
  ADMIN_PASSWORD?: string;
  MEDIA_KV?: KVNamespace;
} {
  return env as unknown as {
    GOOGLE_CLIENT_ID?: string;
    AUTH_SECRET?: string;
    ADMIN_PASSWORD?: string;
    MEDIA_KV?: KVNamespace;
  };
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

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

export async function verifyPasswordCredential(email: string, password: string): Promise<AdminUser> {
  const configuredPassword = runtimeEnv().ADMIN_PASSWORD;
  if (!configuredPassword) throw new Error("ورود با رمز هنوز تنظیم نشده است.");

  const emailAllowed = isAdminEmail(email);
  const passwordAllowed = await timingSafeEqual(password, configuredPassword);
  if (!emailAllowed || !passwordAllowed) throw new Error("ایمیل یا رمز عبور صحیح نیست.");

  return { email: ADMIN_EMAIL, displayName: "مدیر Cookie Time" };
}

type PasswordAttempt = { count: number; expiresAt: number };
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS = 5;

async function passwordRateKey(request: Request): Promise<string> {
  const clientAddress = request.headers.get("cf-connecting-ip") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientAddress));
  const fingerprint = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `auth:password:${fingerprint}`;
}

async function readPasswordAttempts(request: Request): Promise<{ key: string; attempt: PasswordAttempt | null }> {
  const key = await passwordRateKey(request);
  const kv = runtimeEnv().MEDIA_KV;
  if (!kv) return { key, attempt: null };
  const attempt = await kv.get<PasswordAttempt>(key, "json");
  if (!attempt || attempt.expiresAt <= Date.now()) return { key, attempt: null };
  return { key, attempt };
}

export async function passwordLoginAllowed(request: Request): Promise<boolean> {
  const { attempt } = await readPasswordAttempts(request);
  return !attempt || attempt.count < MAX_LOGIN_ATTEMPTS;
}

export async function recordPasswordLoginFailure(request: Request): Promise<void> {
  const kv = runtimeEnv().MEDIA_KV;
  if (!kv) return;
  const { key, attempt } = await readPasswordAttempts(request);
  const next: PasswordAttempt = {
    count: (attempt?.count ?? 0) + 1,
    expiresAt: Date.now() + LOGIN_WINDOW_SECONDS * 1000,
  };
  await kv.put(key, JSON.stringify(next), { expirationTtl: LOGIN_WINDOW_SECONDS });
}

export async function clearPasswordLoginFailures(request: Request): Promise<void> {
  const kv = runtimeEnv().MEDIA_KV;
  if (!kv) return;
  await kv.delete(await passwordRateKey(request));
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
