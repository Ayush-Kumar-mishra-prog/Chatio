import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io } from "socket.io-client";
import { BACKEND, getMe, setAuthToken } from "../api/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "chatio_token";
const USER_KEY = "chatio_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    socket?.disconnect();
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, [socket]);

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

  useEffect(() => {
    if (!user?._id) return undefined;

    const nextSocket = io(BACKEND, {
      query: { userId: user._id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    const handleConnect = () => {
      console.log("Socket connected:", user._id);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
    };

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);
    nextSocket.on("error", handleError);
    nextSocket.on("getOnlineUsers", setOnlineUsers);

    queueMicrotask(() => setSocket(nextSocket));

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("error", handleError);
      nextSocket.off("getOnlineUsers", setOnlineUsers);
      nextSocket.disconnect();
      queueMicrotask(() => {
        setSocket(null);
        setOnlineUsers([]);
      });
    };
  }, [user?._id]);

  const saveSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
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
    }),
    [user, token, loading, onlineUsers, socket, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
