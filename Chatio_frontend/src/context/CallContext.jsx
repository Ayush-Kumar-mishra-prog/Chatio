import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import CallOverlay from "../components/CallOverlay";
import IncomingCallNotification from "../components/IncomingCallNotification";
import {
  getPendingCallInvites,
  respondToCallInvite,
} from "../api/api";
import { useAuth } from "./AuthContext";
import { asId } from "../lib/utils";
import { isMirrorAi } from "../lib/mirrorAi";

const CallContext = createContext(null);

const normalizeConversation = (conversation) => ({
  ...conversation,
  fullName: conversation?.fullName || conversation?.name || "Chat",
  profilePic: conversation?.profilePic || conversation?.image,
});

export const CallProvider = ({ children }) => {
  const { socket, user } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const incomingCallRef = useRef(null);
  const activeCallRef = useRef(null);
  incomingCallRef.current = incomingCall;
  activeCallRef.current = activeCall;

  const applyIncomingCall = useCallback((payload) => {
    if (!payload?.callId) return;
    setIncomingCall({
      ...payload,
      incoming: true,
      conversation: normalizeConversation(payload.conversation),
    });
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleIncomingCall = (payload) => applyIncomingCall(payload);
    const handleCallEnd = ({ callId } = {}) => {
      setIncomingCall((current) =>
        !callId || current?.callId === callId ? null : current,
      );
      setActiveCall((current) =>
        !callId || current?.callId === callId ? null : current,
      );
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:end", handleCallEnd);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:end", handleCallEnd);
    };
  }, [socket, applyIncomingCall]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const pollPendingCalls = async () => {
      if (incomingCallRef.current || activeCallRef.current) return;
      try {
        const { data } = await getPendingCallInvites();
        if (data.invite) applyIncomingCall(data.invite);
      } catch {
        // polling fallback when socket unavailable
      }
    };

    pollPendingCalls();
    const interval = setInterval(pollPendingCalls, 2000);
    return () => clearInterval(interval);
  }, [user?._id, applyIncomingCall]);

  const startCall = useCallback((conversation, type) => {
    if (!conversation || conversation.type === "group" || isMirrorAi(conversation)) {
      return;
    }
    const normalized = normalizeConversation(conversation);
    setIncomingCall(null);
    setActiveCall({
      callId: `${Date.now()}-${normalized._id}`,
      roomID: `chatio_${asId(normalized._id)}_${Date.now()}`,
      conversation: normalized,
      type,
      incoming: false,
    });
  }, []);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    respondToCallInvite(incomingCall.callId, "answer").catch(() => {});
    setActiveCall({ ...incomingCall, incoming: true, autoAccept: true });
    setIncomingCall(null);
    navigate("/chat");
  }, [incomingCall, navigate]);

  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    respondToCallInvite(incomingCall.callId, "decline").catch(() => {});
    socket?.emit("call:end", {
      receiverIds: [incomingCall.from],
      callId: incomingCall.callId,
    });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const endActiveCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  const value = useMemo(
    () => ({ startCall, activeCall, incomingCall }),
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
      <CallOverlay activeCall={activeCall} onClose={endActiveCall} />
    </CallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};
