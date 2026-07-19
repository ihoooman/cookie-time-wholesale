import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";

const LOCAL_ADMIN: ChatGPTUser = {
  email: "local-admin@cookie-time.test",
  displayName: "مدیر محلی",
  fullName: "مدیر محلی",
};

function configuredAdminEmails(): string[] {
  const value = (env as unknown as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "";
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  if (process.env.NODE_ENV === "development" && email === LOCAL_ADMIN.email) return true;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export async function getAuthorizedAdmin(returnTo = "/admin"): Promise<ChatGPTUser | null> {
  let user = await getChatGPTUser();
  if (!user && process.env.NODE_ENV === "development") user = LOCAL_ADMIN;
  if (!user) user = await requireChatGPTUser(returnTo);
  return isAdminEmail(user.email) ? user : null;
}

export async function isAuthorizedAdminRequest(): Promise<boolean> {
  const user = await getChatGPTUser();
  if (!user && process.env.NODE_ENV === "development") return true;
  return Boolean(user && isAdminEmail(user.email));
}
