import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");
const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);

function isAllowed(method: string, segments: string[]) {
  if (method === "GET") {
    return segments.length === 1 && segments[0] === "organizations";
  }
  if (method === "POST") {
    return (segments.length === 1 && segments[0] === "organizations")
      || (segments.length === 3 && segments[0] === "organizations" && segments[2] === "agents")
      || (segments.length === 5 && segments[0] === "organizations" && segments[2] === "agents" && segments[4] === "duplicate");
  }
  if (method === "PATCH") {
    return (segments.length === 2 && segments[0] === "organizations")
      || (segments.length === 4 && segments[0] === "organizations" && segments[2] === "agents");
  }
  return method === "DELETE" && segments.length === 4
    && segments[0] === "organizations" && segments[2] === "agents";
}

function backendAuthorization(request: NextRequest): string | undefined {
  const accessToken = request.cookies.get("querydesk-access-token")?.value;
  if (accessToken) return `Bearer ${accessToken}`;

  const serviceToken = process.env.BACKEND_SERVICE_TOKEN;
  if (serviceToken) return `Bearer ${serviceToken}`;

  if (process.env.NODE_ENV !== "production") {
    const user = process.env.DEV_AUTH_USER;
    const password = process.env.DEV_AUTH_PASSWORD;
    if (user && password) return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  }
  return undefined;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;
  if (!isAllowed(request.method, segments)) {
    return NextResponse.json({ error: { code: "BFF_ROUTE_NOT_ALLOWED", message: "This backend operation is not available." } }, { status: 404 });
  }

  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: { code: "CROSS_SITE_REQUEST_BLOCKED", message: "Cross-site requests are not allowed." } }, { status: 403 });
    }
  }

  const authorization = backendAuthorization(request);
  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);

  const backendPath = segments.map(encodeURIComponent).join("/");
  const backendUrl = `${API_BASE_URL}/${backendPath}${request.nextUrl.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("Content-Type", responseType);
    const location = response.headers.get("location");
    if (location) responseHeaders.set("Location", location);
    return new NextResponse(response.status === 204 ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: "QueryDesk could not reach the application service. Please try again shortly.",
      },
    }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
