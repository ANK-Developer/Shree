import axios from "axios";

export const TOKEN_KEY = "shree_admin_token";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Uploaded files (member photos) API ke same server se serve hote hain, "/api" ke bina
export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_URL,
});

// Har request me token automatically lagao
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
