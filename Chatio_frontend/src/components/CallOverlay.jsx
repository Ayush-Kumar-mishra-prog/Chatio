import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import assets from "../assets/assets";
import { createCallLog, sendCallInvite } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { asId } from "../lib/utils";
import { toast } from "react-toastify";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const CallOverlay = ({ activeCall, onClose }) => {
  const { user, socket } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const invitedRef = useRef(false);
  const acceptedCallRef = useRef(null);

  const [status, setStatus] = useState("Calling");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const receiverIds = useMemo(
    () =>
      activeCall?.conversation?.members
        ?.map((member) => asId(member._id || member))
        .filter((id) => id && id !== asId(user?._id)) || [],
    [activeCall?.conversation?.members, user?._id],
  );

  useEffect(() => {
    if (!activeCall) return;
    setStatus(activeCall.incoming ? "Incoming call" : "Calling");
    setMuted(false);
    setCameraOff(false);
    invitedRef.current = false;
  }, [activeCall]);

  const endCall = useCallback(() => {
    if (!activeCall) return;
    const targets = activeCall.incoming ? [activeCall.from] : receiverIds;
    socket?.emit("call:end", {
      receiverIds: targets,
      callId: activeCall.callId,
    });
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    onClose();
  }, [activeCall, onClose, receiverIds, socket]);

  const acceptCall = useCallback(async () => {
    if (!socket || !activeCall?.offer) return;
    try {
      setStatus("Connecting...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice", {
            to: activeCall.from,
            candidate: event.candidate,
          });
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(activeCall.offer));
      await Promise.all(
        pendingIceRef.current.map((candidate) =>
          peer.addIceCandidate(new RTCIceCandidate(candidate)),
        ),
      );
      pendingIceRef.current = [];

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("call:answer", {
        to: activeCall.from,
        answer,
        callId: activeCall.callId,
      });

      createCallLog({
        conversationId: activeCall.conversation._id,
        type: activeCall.type,
        status: "incoming",
      }).catch(() => {});

      setStatus("Connected");
    } catch {
      toast.error("Could not join call. Allow microphone and camera access.");
      endCall();
    }
  }, [activeCall, endCall, socket]);

  useEffect(() => {
    if (!socket || !activeCall) return undefined;

    const setupPeer = async (stream) => {
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        const targets = activeCall.incoming ? [activeCall.from] : receiverIds;
        targets.forEach((to) => {
          socket.emit("call:ice", { to, candidate: event.candidate });
        });
      };
      return peer;
    };

    const startOutgoingCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.type === "video",
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = await setupPeer(stream);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        const invitePayload = {
          callId: activeCall.callId,
          roomID: activeCall.roomID,
          conversation: activeCall.conversation,
          receiverIds,
          type: activeCall.type,
          offer,
          caller: user,
        };

        if (!invitedRef.current) {
          invitedRef.current = true;
          await sendCallInvite(invitePayload).catch(() => {});
          socket.emit("call:invite", invitePayload);
          createCallLog({
            conversationId: activeCall.conversation._id,
            type: activeCall.type,
            status: "outgoing",
          }).catch(() => {});
        }
      } catch {
        toast.error("Call could not start. Allow microphone and camera access.");
        onClose();
      }
    };

    if (!activeCall.incoming) startOutgoingCall();

    const handleAnswer = async ({ answer }) => {
      if (!peerRef.current || !answer) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setStatus("Connected");
    };

    const handleIce = async ({ candidate }) => {
      if (!candidate) return;
      if (!peerRef.current) {
        pendingIceRef.current.push(candidate);
        return;
      }
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleEnd = () => onClose();

    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:end", handleEnd);

    return () => {
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:end", handleEnd);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
    };
  }, [activeCall, onClose, receiverIds, socket, user]);

  useEffect(() => {
    if (!activeCall?.incoming || !activeCall.autoAccept) return;
    if (acceptedCallRef.current === activeCall.callId) return;
    acceptedCallRef.current = activeCall.callId;
    acceptCall();
  }, [acceptCall, activeCall?.autoAccept, activeCall?.callId, activeCall?.incoming]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted((value) => !value);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });
    setCameraOff((value) => !value);
  };

  if (!activeCall) return null;

  const peerName =
    activeCall.conversation?.fullName ||
    activeCall.caller?.name ||
    "Contact";
  const peerImage =
    activeCall.conversation?.profilePic ||
    activeCall.caller?.image ||
    assets.avatar_icon;

  const showAcceptUi = activeCall.incoming && status === "Incoming call";
  const isVideoCall = activeCall.type === "video";
  const isConnected = status === "Connected";

  return (
    <div className="fixed inset-0 z-[80] bg-[#0b141a] text-white flex flex-col overflow-hidden">
      {(!isVideoCall || !isConnected) && (
        <div className="pt-[max(2rem,env(safe-area-inset-top))] pb-4 text-center shrink-0">
          {(!isVideoCall || !isConnected) && (
            <img
              src={peerImage}
              alt=""
              className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-white/10"
            />
          )}
          <h2 className="mt-5 px-6 text-2xl max-sm:text-xl font-semibold truncate">{peerName}</h2>
          <p className="mt-1 text-sm text-white/60">{status}</p>
        </div>
      )}

      {isVideoCall ? (
        <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          {isConnected && (
            <div className="absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 max-w-[calc(100%-7rem)] rounded-full bg-black/45 px-3 py-2 backdrop-blur-md sm:left-5 sm:top-[calc(1rem+env(safe-area-inset-top))]">
              <p className="max-w-56 truncate text-sm font-semibold leading-4 sm:max-w-72">
                {peerName}
              </p>
              <p className="text-[11px] leading-4 text-[#9deacb]">{status}</p>
            </div>
          )}
          {!cameraOff && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 h-28 w-20 rounded-xl object-cover border-2 border-white/35 bg-slate-900 shadow-2xl sm:right-5 sm:top-[calc(1rem+env(safe-area-inset-top))] sm:h-36 sm:w-24 md:h-40 md:w-28"
            />
          )}
        </div>
      ) : (
        <>
          <audio ref={remoteAudioRef} autoPlay />
          <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
          <div className="flex-1" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-10 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:gap-6 sm:pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={toggleMute}
          className="h-12 w-12 rounded-full bg-white/15 grid place-items-center hover:bg-white/25 sm:h-14 sm:w-14"
          title="Mute"
        >
          {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </button>

        {activeCall.type === "video" && (
          <button
            type="button"
            onClick={toggleCamera}
            className="h-12 w-12 rounded-full bg-white/15 grid place-items-center hover:bg-white/25 sm:h-14 sm:w-14"
            title="Camera"
          >
            {cameraOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
          </button>
        )}

        {showAcceptUi && (
          <button
            type="button"
            onClick={acceptCall}
            className="h-14 w-14 rounded-full bg-[#00a884] grid place-items-center hover:bg-[#008f72] sm:h-16 sm:w-16"
            title="Accept"
          >
            <Phone className="size-7" />
          </button>
        )}

        <button
          type="button"
          onClick={endCall}
          className="h-14 w-14 rounded-full bg-red-500 grid place-items-center hover:bg-red-600 rotate-[135deg] sm:h-16 sm:w-16"
          title="End call"
        >
          <Phone className="size-7" />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
