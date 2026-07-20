/** Cloudflare Worker entry point for Cookie Time. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  GOOGLE_CLIENT_ID?: string;
  AUTH_SECRET?: string;
}

interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
