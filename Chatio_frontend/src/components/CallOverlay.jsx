import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import assets from "../assets/assets";
import { createCallLog } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const CallOverlay = ({ activeCall, onClose }) => {
  const { user, socket } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const [status, setStatus] = useState(
    activeCall?.incoming ? "Incoming call" : "Calling",
  );
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const receiverIds = useMemo(
    () =>
      activeCall?.conversation?.members
        ?.map((member) => member._id || member)
        .filter((id) => id !== user?._id) || [],
    [activeCall?.conversation?.members, user?._id],
  );

  useEffect(() => {
    if (!socket || !activeCall) return undefined;

    const setupPeer = async (stream) => {
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        console.log("Received remote track");
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = event.streams[0];
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        const targets = activeCall.incoming ? [activeCall.from] : receiverIds;
        targets.forEach((to) => {
          console.log("Sending ICE candidate to", to);
          socket.emit("call:ice", { to, candidate: event.candidate });
        });
      };
      return peer;
    };

    const startOutgoingCall = async () => {
      try {
        console.log("Starting outgoing call to", receiverIds);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.type === "video",
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = await setupPeer(stream);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("call:invite", {
          callId: activeCall.callId,
          conversation: activeCall.conversation,
          receiverIds,
          type: activeCall.type,
          offer,
          caller: user,
        });
        console.log("Emitted call:invite event");
        await createCallLog({
          conversationId: activeCall.conversation._id,
          type: activeCall.type,
          status: "outgoing",
        });
      } catch (error) {
        console.error("Call setup error:", error);
        toast.error(
          "Call could not start. Please allow camera and microphone access.",
        );
        onClose();
      }
    };

    if (!activeCall.incoming) startOutgoingCall();

    const handleAnswer = async ({ answer }) => {
      console.log("Received call answer");
      if (!peerRef.current || !answer) return;
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
      setStatus("Connected");
    };
    const handleIce = async ({ candidate }) => {
      if (!candidate) return;
      if (!peerRef.current) {
        console.log("Peer connection not ready, queueing ICE candidate");
        pendingIceRef.current.push(candidate);
        return;
      }
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };
    const handleEnd = () => {
      console.log("Call ended by remote peer");
      onClose();
    };

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

  const acceptCall = async () => {
    if (!socket) return;
    try {
      console.log("Accepting incoming call from", activeCall.from);
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
        console.log("Received remote track on answer");
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = event.streams[0];
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate on answer to", activeCall.from);
          socket.emit("call:ice", {
            to: activeCall.from,
            candidate: event.candidate,
          });
        }
      };
      await peer.setRemoteDescription(
        new RTCSessionDescription(activeCall.offer),
      );
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
      console.log("Sent call:answer");
      await createCallLog({
        conversationId: activeCall.conversation._id,
        type: activeCall.type,
        status: "incoming",
      });
      setStatus("Connected");
    } catch (error) {
      console.error("Call accept error:", error);
      toast.error(
        "Call could not start. Please allow camera and microphone access.",
      );
      endCall();
    }
  };

  const endCall = () => {
    const targets = activeCall.incoming ? [activeCall.from] : receiverIds;
    console.log("Ending call, sending to", targets);
    socket?.emit("call:end", {
      receiverIds: targets,
      callId: activeCall.callId,
    });
    onClose();
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-[#111b21] text-white flex flex-col items-center justify-between p-6">
      <div className="text-center pt-8">
        <img
          src={
            activeCall.conversation?.profilePic ||
            activeCall.caller?.image ||
            assets.avatar_icon
          }
          alt=""
          className="mx-auto h-28 w-28 rounded-full object-cover border-4 border-white/10"
        />
        <h2 className="mt-5 text-2xl font-semibold">
          {activeCall.conversation?.fullName ||
            activeCall.caller?.name ||
            "Call"}
        </h2>
        <p className="mt-1 text-sm text-white/70">{status}</p>
      </div>

      {activeCall.type === "video" && (
        <div className="relative w-full max-w-4xl flex-1 min-h-0 my-6 rounded-lg overflow-hidden bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 h-32 w-24 rounded-md object-cover bg-slate-900 border border-white/20"
          />
        </div>
      )}

      {activeCall.type === "voice" && <audio ref={remoteVideoRef} autoPlay />}
      {activeCall.type === "voice" && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
      )}

      <div className="flex items-center gap-4 pb-8">
        <button
          onClick={toggleMute}
          className="h-14 w-14 rounded-full bg-white/10 grid place-items-center hover:bg-white/20"
          title="Mute"
        >
          {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </button>
        {activeCall.type === "video" && (
          <button
            onClick={toggleCamera}
            className="h-14 w-14 rounded-full bg-white/10 grid place-items-center hover:bg-white/20"
            title="Camera"
          >
            {cameraOff ? (
              <VideoOff className="size-6" />
            ) : (
              <Video className="size-6" />
            )}
          </button>
        )}
        {activeCall.incoming && status === "Incoming call" && (
          <button
            onClick={acceptCall}
            className="h-16 w-16 rounded-full bg-[#00a884] grid place-items-center hover:bg-[#008f72]"
            title="Accept"
          >
            <Phone className="size-7" />
          </button>
        )}
        <button
          onClick={endCall}
          className="h-16 w-16 rounded-full bg-red-500 grid place-items-center hover:bg-red-600 rotate-[135deg]"
          title="End call"
        >
          <Phone className="size-7" />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
