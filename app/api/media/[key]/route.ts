import { getMediaObject } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  const object = await getMediaObject(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", object.contentType);
  if (object.etag) headers.set("etag", object.etag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
