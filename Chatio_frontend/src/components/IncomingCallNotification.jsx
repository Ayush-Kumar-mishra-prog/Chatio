import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import assets from "../assets/assets";

const IncomingCallNotification = ({ call, onAccept, onReject }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!call) {
      audioRef.current?.pause();
      return undefined;
    }

    audioRef.current?.play().catch(() => {});
    return () => audioRef.current?.pause();
  }, [call]);

  if (!call) return null;

  const callerName =
    call.caller?.name ||
    call.caller?.fullName ||
    call.conversation?.fullName ||
    call.conversation?.name ||
    "Unknown";
  const callerImage =
    call.caller?.image ||
    call.caller?.profilePic ||
    call.conversation?.profilePic ||
    call.conversation?.image ||
    assets.avatar_icon;
  const isVideo = call.type === "video";

  return (
    <>
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
        loop
      />

      <div className="fixed inset-0 z-[70] bg-[#111b21]/95 flex flex-col items-center justify-between p-8 text-white">
        <div className="pt-12 text-center">
          <p className="text-sm text-white/60 uppercase tracking-widest mb-8">
            Incoming {isVideo ? "video" : "voice"} call
          </p>
          <div className="relative mx-auto mb-6">
            <span className="absolute inset-0 rounded-full bg-[#00a884]/30 animate-ping" />
            <span className="absolute -inset-3 rounded-full border-2 border-[#00a884]/40 animate-pulse" />
            <img
              src={callerImage}
              alt={callerName}
              className="relative h-36 w-36 rounded-full object-cover border-4 border-white/20"
            />
          </div>
          <h2 className="text-3xl font-semibold">{callerName}</h2>
          <p className="mt-2 text-white/60 flex items-center justify-center gap-2">
            {isVideo ? <Video className="size-5" /> : <Phone className="size-5" />}
            Chatio {isVideo ? "video" : "voice"} call
          </p>
        </div>

        <div className="flex items-center gap-16 pb-16">
          <button
            type="button"
            onClick={onReject}
            className="flex flex-col items-center gap-3"
            title="Decline"
          >
            <span className="h-16 w-16 rounded-full bg-red-500 grid place-items-center hover:bg-red-600 transition shadow-lg">
              <PhoneOff className="size-7" />
            </span>
            <span className="text-sm text-white/70">Decline</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-3"
            title="Accept"
          >
            <span className="h-16 w-16 rounded-full bg-[#00a884] grid place-items-center hover:bg-[#008f72] transition shadow-lg">
              <Phone className="size-7" />
            </span>
            <span className="text-sm text-white/70">Accept</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default IncomingCallNotification;
