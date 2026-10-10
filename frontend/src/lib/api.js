const BASE = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "le_token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage blocked: the user just has to log in again next visit */ }
};

// api("/shop/perfumes")
// api("/auth/login", { method: "POST", body: { email, password } })
// api("/uploads?type=receipt", { method: "POST", formData })
export async function api(path, { method = "GET", body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData; // the browser sets the multipart header itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith("/auth/login")) {
      setToken(null);
      window.dispatchEvent(new Event("auth:expired"));
    }
    const err = new Error(data?.error || "Something went wrong. Try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}