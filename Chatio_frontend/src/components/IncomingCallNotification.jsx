import { useEffect, useState } from "react";
import { Phone, X } from "lucide-react";
import assets from "../assets/assets";

const IncomingCallNotification = ({ call, onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!call) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [call]);

  if (!call || !isVisible) return null;

  const handleAccept = () => {
    setIsVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    setIsVisible(false);
    onReject?.();
  };

  return (
    <div className="fixed top-4 right-4 z-40 sm:top-6 sm:right-6 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white shadow-2xl rounded-lg p-4 w-80 sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <img
              src={
                call.conversation?.profilePic ||
                call.caller?.image ||
                assets.avatar_icon
              }
              alt={call.conversation?.fullName || call.caller?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {call.conversation?.fullName || call.caller?.name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {call.type === "video" ? "📹 Video Call" : "☎️ Voice Call"}
              </p>
            </div>
          </div>
          <button
            onClick={handleReject}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Reject"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            title="Accept call"
          >
            <Phone className="w-5 h-5" />
            <span>Accept</span>
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            title="Reject call"
          >
            <X className="w-5 h-5" />
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
