import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  BACKEND,
  getMe,
  getOnlineUsersApi,
  logoutUser,
  sendPresenceHeartbeat,
  setAuthToken,
} from "../api/api";
import { asId } from "../lib/utils";

const AuthContext = createContext(null);

const TOKEN_KEY = "chatio_token";
const REFRESH_TOKEN_KEY = "chatio_refresh_token";
const USER_KEY = "chatio_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const socketRef = useRef(null);
  const trackedUserIdsRef = useRef([]);

  const logout = useCallback(() => {
    logoutUser().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setSocket(null);
    setSocketReady(false);
    setOnlineUsers([]);
  }, []);

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    getMe()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch((error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          logout();
        } else {
          console.error("Auth restore error:", error);
        }
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  const socketDisabled =
    import.meta.env.VITE_DISABLE_SOCKET === "true" ||
    BACKEND.includes("vercel.app");

  useEffect(() => {
    if (!user?._id || socketDisabled) {
      setSocket(null);
      setSocketReady(false);
      return undefined;
    }

    const userId = asId(user._id);
    const nextSocket = io(BACKEND, {
      query: { userId },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    const handleConnect = () => {
      console.log("Socket connected:", userId);
      setSocketReady(true);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketReady(false);
    };

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);
    nextSocket.on("connect_error", () => setSocketReady(false));
    nextSocket.on("getOnlineUsers", (ids) => {
      setOnlineUsers(ids.map(asId));
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);
    if (nextSocket.connected) setSocketReady(true);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("getOnlineUsers");
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setSocketReady(false);
    };
  }, [user?._id, socketDisabled]);

  useEffect(() => {
    if (!user?._id || !token) return undefined;

    const refreshPresence = async () => {
      try {
        await sendPresenceHeartbeat();
        const ids = trackedUserIdsRef.current;
        const { data } = await getOnlineUsersApi(ids);
        if (data.onlineUserIds) {
          setOnlineUsers(data.onlineUserIds.map(asId));
        }
      } catch {
        // HTTP presence works even when socket fails (e.g. on Vercel)
      }
    };

    refreshPresence();
    const interval = setInterval(refreshPresence, 15000);
    return () => clearInterval(interval);
  }, [user?._id, token]);

  const trackOnlineUsers = useCallback((userIds = []) => {
    trackedUserIdsRef.current = [...new Set(userIds.map(asId).filter(Boolean))];
  }, []);

  const saveSession = (nextToken, nextUser, nextRefreshToken = null) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    if (nextRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    }
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      saveSession,
      logout,
      updateUser,
      onlineUsers,
      socket,
      socketReady,
      trackOnlineUsers,
    }),
    [user, token, loading, onlineUsers, socket, socketReady, logout, trackOnlineUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
