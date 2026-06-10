import { useEffect, useRef, useState } from "react";
import { Phone, Video, X, Volume2 } from "lucide-react";
import assets from "../assets/assets";

const IncomingCallNotification = ({ call, onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!call) {
      setIsVisible(false);
      audioRef.current?.pause();
      return;
    }

    setIsVisible(true);
    audioRef.current?.play().catch(() => {
      console.log("Audio autoplay prevented by browser");
    });
  }, [call]);

  if (!call || !isVisible) return null;

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
  const CallTypeIcon = call.type === "video" ? Video : Phone;

  const stopRinging = () => {
    setIsVisible(false);
    audioRef.current?.pause();
  };

  const handleAccept = () => {
    stopRinging();
    onAccept?.();
  };

  const handleReject = () => {
    stopRinging();
    onReject?.();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
        loop
      />

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative h-12 w-12 shrink-0">
            <img
              src={callerImage}
              alt={callerName}
              className="h-12 w-12 rounded-full object-cover"
            />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#00a884] text-white ring-2 ring-emerald-50">
              <CallTypeIcon className="size-3.5" />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {callerName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#075e54]">
              <Volume2 className="size-3.5 animate-pulse" />
              Incoming {call.type === "video" ? "video" : "voice"} call
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="h-10 rounded-md bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 active:bg-red-700"
            title="Reject call"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <X className="size-4" />
              Reject
            </span>
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="h-10 rounded-md bg-[#00a884] text-sm font-semibold text-white transition hover:bg-[#008f72] active:bg-[#00785f]"
            title="Accept call"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Phone className="size-4" />
              Accept
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default IncomingCallNotification;
