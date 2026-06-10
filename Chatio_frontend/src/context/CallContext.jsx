import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import CallOverlay from "../components/CallOverlay";
import IncomingCallNotification from "../components/IncomingCallNotification";
import { useAuth } from "./AuthContext";

const CallContext = createContext(null);

const normalizeConversation = (conversation) => ({
  ...conversation,
  fullName: conversation?.fullName || conversation?.name || "Chat",
  profilePic: conversation?.profilePic || conversation?.image,
});

export const CallProvider = ({ children }) => {
  const { socket } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    if (!socket) return undefined;

    const handleIncomingCall = (payload) => {
      setIncomingCall({
        ...payload,
        incoming: true,
        conversation: normalizeConversation(payload.conversation),
      });
    };

    const handleCallEnd = ({ callId } = {}) => {
      setIncomingCall((current) =>
        !callId || current?.callId === callId ? null : current,
      );
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:end", handleCallEnd);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:end", handleCallEnd);
    };
  }, [socket]);

  const startCall = useCallback((conversation, type) => {
    setIncomingCall(null);
    setActiveCall({
      callId: `${Date.now()}-${conversation._id}`,
      conversation: normalizeConversation(conversation),
      type,
      incoming: false,
    });
  }, []);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    setActiveCall({ ...incomingCall, autoAccept: true });
    setIncomingCall(null);
    navigate("/chat");
  }, [incomingCall, navigate]);

  const rejectIncomingCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit("call:end", {
        receiverIds: [incomingCall.from],
        callId: incomingCall.callId,
      });
    }
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const endActiveCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  const value = useMemo(
    () => ({
      startCall,
      activeCall,
      incomingCall,
    }),
    [startCall, activeCall, incomingCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <IncomingCallNotification
        call={incomingCall}
        onAccept={acceptIncomingCall}
        onReject={rejectIncomingCall}
      />
      <CallOverlay
        activeCall={activeCall}
        onClose={endActiveCall}
      />
    </CallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};
