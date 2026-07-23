import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { fetchDocumentContent } from "@/lib/server-api";

type RouteContext = { params: Promise<{ organizationId: string; documentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { organizationId, documentId } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("arffy-ai-access-token")?.value
    ?? cookieStore.get("querydesk-access-token")?.value;
  const authorization = token ? `Bearer ${token}` : undefined;
  const textPreview = request.nextUrl.searchParams.get("mode") === "text";
  try {
    const upstream = await fetchDocumentContent(organizationId, documentId, textPreview, authorization);
    if (!upstream.ok) {
      const body = await upstream.text();
      return new Response(body || "Document preview is unavailable.", {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain" },
      });
    }
    const headers = new Headers();
    ["Content-Type", "Content-Length", "Content-Disposition", "Cache-Control", "X-Content-Type-Options"]
      .forEach((name) => { const value = upstream.headers.get(name); if (value) headers.set(name, value); });
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response("The backend could not be reached.", { status: 503 });
  }
}
