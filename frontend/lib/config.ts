export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const API_BASE_URL = `${SERVER_URL}/api`;

export const apiFetch = (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
};

export const formatAssetUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://localhost:3000")) {
    return url.replace("http://localhost:3000", SERVER_URL);
  }
  if (url.startsWith("http://localhost:3001")) {
    return url.replace("http://localhost:3001", SERVER_URL);
  }
  return url;
};
