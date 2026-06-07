import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BACKEND}/auth`,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const googleAuth = (code) => api.get(`/google?code=${code}`);
export const facebookAuth = (payload) => api.post("/facebook", payload);
export const loginUser = (payload) => api.post("/login", payload);
export const signupUser = (payload) => api.post("/signup", payload);
export const verifyEmail = (payload) => api.post("/verify-email", payload);
export const getMe = () => api.get("/me");
export const updateProfile = (payload) => api.put("/profile", payload);

export default api;
