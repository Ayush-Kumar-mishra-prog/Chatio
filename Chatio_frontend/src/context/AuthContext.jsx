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
  const [socketReady, setSocketReady] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const socketRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
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

  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      setSocketReady(false);
      return undefined;
    }

    const userId = user._id?.toString?.() ?? String(user._id);
    const nextSocket = io(BACKEND, {
      query: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
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
    nextSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketReady(false);
    });
    nextSocket.on("getOnlineUsers", setOnlineUsers);

    socketRef.current = nextSocket;
    setSocket(nextSocket);
    if (nextSocket.connected) setSocketReady(true);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("getOnlineUsers", setOnlineUsers);
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setSocketReady(false);
      setOnlineUsers([]);
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
      socketReady,
    }),
    [user, token, loading, onlineUsers, socket, socketReady, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
