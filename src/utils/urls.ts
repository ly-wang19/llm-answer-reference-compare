export function normalizeUrl(rawUrl: string, baseUrl?: string): string {
  try {
    const url = unwrapTrackingUrl(new URL(rawUrl, baseUrl));
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    if (url.pathname === "/") {
      url.pathname = "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.trim();
  }
}

function unwrapTrackingUrl(url: URL): URL {
  const target = url.searchParams.get("target") || url.searchParams.get("url");
  if (!target) {
    return url;
  }

  const trackingHosts = new Set(["link.wtturl.cn"]);
  if (!trackingHosts.has(url.hostname.toLowerCase())) {
    return url;
  }

  try {
    return new URL(target);
  } catch {
    return url;
  }
}
