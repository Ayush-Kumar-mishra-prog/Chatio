import { useEffect, useRef, useState } from "react";
import { Phone, X, Volume2 } from "lucide-react";
import assets from "../assets/assets";

const IncomingCallNotification = ({ call, onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!call) {
      setIsVisible(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsVisible(true);
      // Play ringing sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          console.log("Audio autoplay prevented by browser");
        });
      }
    }
  }, [call]);

  if (!call || !isVisible) return null;

  const handleAccept = () => {
    setIsVisible(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onAccept?.();
  };

  const handleReject = () => {
    setIsVisible(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onReject?.();
  };

  return (
    <>
      {/* Ringing Audio */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
        loop
      />

      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-sm animate-in scale-in-95 duration-300">
          {/* Header with caller info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <img
                src={
                  call.conversation?.profilePic ||
                  call.caller?.image ||
                  assets.avatar_icon
                }
                alt={call.conversation?.fullName || call.caller?.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg truncate">
                  {call.conversation?.fullName ||
                    call.caller?.name ||
                    "Unknown"}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Volume2 className="w-4 h-4 animate-pulse text-[#00a884]" />
                  {call.type === "video" ? "📹 Video Call" : "☎️ Voice Call"}
                </p>
              </div>
            </div>
          </div>

          {/* Calling Status */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 animate-pulse">
              Incoming {call.type} call...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95"
              title="Reject call"
            >
              <X className="w-6 h-6" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95"
              title="Accept call"
            >
              <Phone className="w-6 h-6" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCallNotification;
