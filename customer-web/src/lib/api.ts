export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { authToken?: string } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (options.authToken) headers.set("Authorization", `Bearer ${options.authToken}`);

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {
      // ignore
    }
    const message = detail?.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

