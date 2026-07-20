/** Cloudflare Worker entry point for Cookie Time. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA_KV: KVNamespace;
  /** Legacy Sites deployment binding; direct Cloudflare deploys use MEDIA_KV. */
  MEDIA?: R2Bucket;
  GOOGLE_CLIENT_ID?: string;
  AUTH_SECRET?: string;
  ADMIN_PASSWORD?: string;
}

interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) return response;

    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
