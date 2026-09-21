export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const API_BASE_URL = `${SERVER_URL}/api`;

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // When running locally on localhost, route API calls directly to local backend (http://localhost:3000)
  // so that local endpoints and updates (like subscriptions) are always reachable
  let targetUrl = url;
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocalhost && targetUrl.includes("akam-a701.onrender.com")) {
    targetUrl = targetUrl.replace("https://akam-a701.onrender.com", "http://localhost:3000");
  }

  try {
    let res = await fetch(targetUrl, {
      cache: "no-store",
      ...options,
      headers,
      credentials: "include",
    });

    // Fallback: If local returned 404 or connection error, try original URL
    if (!res.ok && res.status === 404 && targetUrl !== url) {
      try {
        const altRes = await fetch(url, {
          cache: "no-store",
          ...options,
          headers,
          credentials: "include",
        });
        if (altRes.ok || altRes.status !== 404) {
          res = altRes;
        }
      } catch {
        // keep local res
      }
    } else if (!res.ok && res.status === 404 && url.includes("akam-a701.onrender.com")) {
      // Remote returned 404, fallback to local backend
      const localUrl = url.replace("https://akam-a701.onrender.com", "http://localhost:3000");
      try {
        const altRes = await fetch(localUrl, {
          cache: "no-store",
          ...options,
          headers,
          credentials: "include",
        });
        if (altRes.ok || altRes.status !== 404) {
          res = altRes;
        }
      } catch {
        // keep remote res
      }
    }

    if (res.status === 401 && typeof window !== "undefined") {
      const hadUser = !!localStorage.getItem("akam_user");
      localStorage.removeItem("akam_user");
      localStorage.removeItem("akam_token");
      document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      if (hadUser) {
        window.dispatchEvent(new Event("akam_user_updated"));
      }
    }

    return res;
  } catch (err) {
    // If targetUrl had network error, retry with alternative url if different
    if (targetUrl !== url) {
      return await fetch(url, {
        cache: "no-store",
        ...options,
        headers,
        credentials: "include",
      });
    }
    throw err;
  }
};

export const formatAssetUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:3000"
      : SERVER_URL;

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }
  if (url.startsWith("uploads/")) {
    return `${baseUrl}/${url}`;
  }
  if (url.startsWith("http://localhost:3000")) {
    return url.replace("http://localhost:3000", baseUrl);
  }
  if (url.startsWith("http://localhost:3001")) {
    return url.replace("http://localhost:3001", baseUrl);
  }
  return url;
};
