import axios from "axios";

export const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BACKEND}/auth`,
  timeout: 10000,
});

export const messageApi = axios.create({
  baseURL: `${BACKEND}/api/message`,
  timeout: 10000,
});

export const callApi = axios.create({
  baseURL: `${BACKEND}/api/calls`,
  timeout: 10000,
});

export const presenceApi = axios.create({
  baseURL: `${BACKEND}/api/presence`,
  timeout: 10000,
});

export const aiApi = axios.create({
  baseURL: `${BACKEND}/api/ai`,
  timeout: 60000,
});

export const statusApi = axios.create({
  baseURL: `${BACKEND}/api/statuses`,
  timeout: 10000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const attachNetworkRecovery = (client) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config || {};
      const method = (config.method || "get").toLowerCase();
      const canRetry = !error.response && method === "get";
      config.__retryCount = config.__retryCount || 0;

      if (canRetry && config.__retryCount < 3) {
        config.__retryCount += 1;
        await sleep(700 * config.__retryCount);
        return client(config);
      }

      if (!error.response) {
        error.response = {
          data: {
            message:
              "Network error - Backend server is not accessible. Please check your connection.",
          },
          status: 0,
        };
      }
      return Promise.reject(error);
    },
  );
};

[api, messageApi, callApi, statusApi, presenceApi, aiApi].forEach(attachNetworkRecovery);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    messageApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    callApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    statusApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    presenceApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    aiApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
    delete messageApi.defaults.headers.common.Authorization;
    delete callApi.defaults.headers.common.Authorization;
    delete statusApi.defaults.headers.common.Authorization;
    delete presenceApi.defaults.headers.common.Authorization;
    delete aiApi.defaults.headers.common.Authorization;
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
export const addGroupMembers = (conversationId, members) =>
  messageApi.put(`/conversation/${conversationId}/members`, { members });
export const getChatMessages = (conversationId, config = {}) =>
  messageApi.get(`/${conversationId}`, config);
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

export const getCallLogs = () => callApi.get("/");
export const sendCallInvite = (payload) => callApi.post("/invite", payload);
export const getPendingCallInvites = () => callApi.get("/pending");
export const respondToCallInvite = (callId, action) =>
  callApi.put(`/invite/${callId}/respond`, { action });
export const createCallLog = (payload) => callApi.post("/", payload);

export const sendMirrorAiMessage = (payload) => aiApi.post("/chat", payload);

export const sendPresenceHeartbeat = () => presenceApi.post("/heartbeat");
export const getOnlineUsersApi = (ids = []) =>
  presenceApi.get("/online", { params: { ids: ids.join(",") } });

export const getStatuses = () => statusApi.get("/");
export const createStatus = (payload) => statusApi.post("/", payload);
export const markStatusViewed = (statusId) => statusApi.put(`/${statusId}/view`);

export default api;
