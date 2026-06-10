import { useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import {
  createCallLog,
  getZegoToken,
  respondToCallInvite,
  sendCallInvite,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { asId } from "../lib/utils";
import { toast } from "react-toastify";

const ZegoCallOverlay = ({ activeCall, onClose }) => {
  const { user, socket } = useAuth();
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const invitedRef = useRef(false);

  useEffect(() => {
    if (!activeCall || !containerRef.current || !user?._id) return undefined;

    let cancelled = false;

    const joinRoom = async () => {
      try {
        const { data } = await getZegoToken(activeCall.roomID);
        if (cancelled) return;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          data.appID,
          data.token,
          activeCall.roomID,
          asId(user._id),
          user.name || "User",
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        instanceRef.current = zp;

        if (!activeCall.incoming && !invitedRef.current) {
          invitedRef.current = true;
          const receiverIds =
            activeCall.conversation?.members
              ?.map((member) => asId(member._id || member))
              .filter((id) => id && id !== asId(user._id)) || [];

          const invitePayload = {
            callId: activeCall.callId,
            roomID: activeCall.roomID,
            conversation: activeCall.conversation,
            receiverIds,
            type: activeCall.type,
            caller: user,
          };

          await sendCallInvite(invitePayload).catch(() => {});

          if (socket) {
            socket.emit("call:invite", invitePayload);
          }

          createCallLog({
            conversationId: activeCall.conversation._id,
            type: activeCall.type,
            status: "outgoing",
          }).catch(() => {});
        }

        if (activeCall.incoming) {
          respondToCallInvite(activeCall.callId, "answer").catch(() => {});
          createCallLog({
            conversationId: activeCall.conversation._id,
            type: activeCall.type,
            status: "incoming",
          }).catch(() => {});
        }

        await zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          showLeavingView: false,
          turnOnCameraWhenJoining: activeCall.type === "video",
          turnOnMicrophoneWhenJoining: true,
          showScreenSharingButton: false,
          onLeaveRoom: () => {
            respondToCallInvite(activeCall.callId, "end").catch(() => {});
            if (socket && activeCall) {
              const targets = activeCall.incoming
                ? [activeCall.from]
                : activeCall.conversation?.members
                    ?.map((member) => asId(member._id || member))
                    .filter((id) => id && id !== asId(user._id)) || [];
              socket.emit("call:end", {
                receiverIds: targets,
                callId: activeCall.callId,
              });
            }
            onClose();
          },
        });
      } catch (error) {
        console.error("Zego call error:", error);
        toast.error(
          error.response?.data?.message ||
            "Call could not start. Check ZegoCloud keys in .env",
        );
        onClose();
      }
    };

    joinRoom();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy?.();
      instanceRef.current = null;
    };
  }, [activeCall, onClose, socket, user]);

  if (!activeCall) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] bg-[#111b21]"
      aria-label="Call in progress"
    />
  );
};

export default ZegoCallOverlay;
