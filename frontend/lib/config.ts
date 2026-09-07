export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const API_BASE_URL = `${SERVER_URL}/api`;

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers,
    credentials: "include",
  });

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
};

export const formatAssetUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("/")) {
    return `${SERVER_URL}${url}`;
  }
  if (url.startsWith("uploads/")) {
    return `${SERVER_URL}/${url}`;
  }
  if (url.startsWith("http://localhost:3000")) {
    return url.replace("http://localhost:3000", SERVER_URL);
  }
  if (url.startsWith("http://localhost:3001")) {
    return url.replace("http://localhost:3001", SERVER_URL);
  }
  return url;
};
