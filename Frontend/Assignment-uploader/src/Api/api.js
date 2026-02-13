import axios from "axios";

/**
 * Backend base URL
 * Must be defined in Vercel / local env as:
 * VITE_API_URL=https://your-backend.onrender.com
 */
const BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

if (!BASE) {
  console.error("❌ VITE_API_URL is not defined");
}

/**
 * Attach auth token if present
 */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch wrapper (used by all API calls)
 */
export async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers || {}),
  };

  let body = options.body;
  if (options.data && !body) {
    body =
      typeof options.data === "string"
        ? options.data
        : JSON.stringify(options.data);
  }

  const res = await fetch(`${BASE}${url}`, {
    method: options.method || "GET",
    headers,
    body,
    credentials: "include", // ✅ REQUIRED for cross-origin (Vercel ↔ Render)
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Axios instance (optional usage)
 */
export const axiosInstance = axios.create({
  baseURL: BASE,
  withCredentials: true, // ✅ same as fetch credentials: "include"
});

axiosInstance.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem("token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  },
  (err) => Promise.reject(err)
);

export default {
  BASE,
  request,
  axiosInstance,
};
