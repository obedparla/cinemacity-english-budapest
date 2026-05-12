export const config = { runtime: "edge" };

const ARTMOZI_AUTH = "Basic " + btoa("cheppers:chpdemo");

interface Route {
  base: string;
  auth?: string;
}

const ROUTES: Record<string, Route> = {
  cinemacity: { base: "https://www.cinemacity.hu" },
  "artmozi-api": { base: "https://artmozi.hu/api", auth: ARTMOZI_AUTH },
  "corvin-api": { base: "https://corvinmozi.hu/api", auth: ARTMOZI_AUTH },
  "artmozi-page": { base: "https://artmozi.hu" },
  "corvin-page": { base: "https://corvinmozi.hu" },
};

const STRIPPED_RESPONSE_HEADERS = ["content-encoding", "transfer-encoding", "connection"];

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetPath = url.searchParams.get("targetPath") ?? "";
  const slashIndex = targetPath.indexOf("/");
  const routeName = slashIndex < 0 ? targetPath : targetPath.slice(0, slashIndex);
  const subPath = slashIndex < 0 ? "" : targetPath.slice(slashIndex);

  const route = ROUTES[routeName];
  if (!route) {
    return new Response(`unknown proxy route: ${routeName}`, { status: 404 });
  }

  // Preserve any extra query params the client passed (excluding targetPath itself)
  const forwardedSearch = new URLSearchParams(url.search);
  forwardedSearch.delete("targetPath");
  const queryString = forwardedSearch.toString();
  const targetUrl = `${route.base}${subPath}${queryString ? `?${queryString}` : ""}`;

  const headers: HeadersInit = {};
  if (route.auth) headers["Authorization"] = route.auth;

  try {
    const upstream = await fetch(targetUrl, { headers });
    const responseHeaders = new Headers(upstream.headers);
    STRIPPED_RESPONSE_HEADERS.forEach((name) => responseHeaders.delete(name));
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`proxy error: ${message}`, { status: 502 });
  }
}
