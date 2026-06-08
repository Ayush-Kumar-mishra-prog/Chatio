import axios from "axios";

export const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BACKEND}/auth`,
  timeout: 10000,
});

export const messageApi = axios.create({
  baseURL: `${BACKEND}/api/message`,
  timeout: 10000,
});

// Error interceptor to handle network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      error.response = {
        data: {
          message: "Network error - Backend server is not accessible. Please check your connection.",
        },
        status: 0,
      };
    }
    return Promise.reject(error);
  }
);

messageApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      error.response = {
        data: {
          message: "Network error - Backend server is not accessible. Please check your connection.",
        },
        status: 0,
      };
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    messageApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
    delete messageApi.defaults.headers.common.Authorization;
  }
};

export const googleAuth = (code) => api.get(`/google?code=${code}`);
export const facebookAuth = (payload) => api.post("/facebook", payload);
export const loginUser = (payload) => api.post("/login", payload);
export const signupUser = (payload) => api.post("/signup", payload);
export const verifyEmail = (payload) => api.post("/verify-email", payload);
export const getMe = () => api.get("/me");
export const updateProfile = (payload) => api.put("/profile", payload);
export const deleteAccount = () => api.delete("/account");

export const getChatSidebar = () => messageApi.get("/users");
export const createDirectChat = (userId) =>
  messageApi.post("/conversation/direct", { userId });
export const createGroupChat = (payload) =>
  messageApi.post("/conversation/group", payload);
export const getChatMessages = (conversationId) => messageApi.get(`/${conversationId}`);
export const sendChatMessage = (conversationId, payload) =>
  messageApi.post(`/send/${conversationId}`, payload);
export const toggleFavoriteChat = (conversationId) =>
  messageApi.put(`/conversation/${conversationId}/favorite`);
export const toggleBlockChat = (conversationId) =>
  messageApi.put(`/conversation/${conversationId}/block`);
export const removeGroupMember = (conversationId, memberId) =>
  messageApi.delete(`/conversation/${conversationId}/member/${memberId}`);
export const deleteGroupChat = (conversationId) =>
  messageApi.delete(`/conversation/${conversationId}`);

export default api;
