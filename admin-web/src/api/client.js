import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("igatpuri_admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

