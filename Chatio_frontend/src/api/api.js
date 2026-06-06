import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://chatio-backend-server.vercel.app";

const api = axios.create({
  baseURL: `${BACKEND}/auth`,
});

export const googleAuth = (code) => api.get(`/google?code=${code}`);
