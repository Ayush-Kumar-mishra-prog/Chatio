import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import assets from "../assets/assets";

// Dummy Data (Ensure IDs match your sidebar data)
const STATUS_DUMMY_DATA = {
  "680f50e4f10f3cd28382ecf9": {
    // Martin's ID
    fullName: "Martin Johnson",
    profilePic: assets.profile_martin,
    stories: [
      {
        id: "s1",
        type: "image",
        url: "https://picsum.photos/1080/1920?random=1",
      },
      {
        id: "s2",
        type: "text",
        content: "Chatio is Awesome! 🔥",
        bgColor: "bg-gradient-to-br from-emerald-500 to-teal-700",
      },
      {
        id: "s3",
        type: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
    ],
  },
  1: {
    // Example for user with ID "1"
    fullName: "Ayush",
    profilePic: assets.avatar_icon,
    stories: [
      {
        id: "a1",
        type: "image",
        url: "https://picsum.photos/1080/1920?random=10",
      },
    ],
  },
  2: {
    fullName: "Chatio User",
    profilePic: assets.avatar_icon,
    stories: [
      {
        id: "a2",
        type: "text",
        content: "New Status Update!",
        bgColor: "bg-purple-600",
      },
    ],
  },
  default: {
    fullName: "Chatio User",
    profilePic: assets.avatar_icon,
    stories: [
      {
        id: "sd1",
        type: "text",
        content: "Check out my new status!",
        bgColor: "bg-purple-600",
      },
      {
        id: "sd2",
        type: "image",
        url: "https://picsum.photos/1080/1920?random=2",
      },
    ],
  },
};

const StatusPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const userData = STATUS_DUMMY_DATA[userId] || STATUS_DUMMY_DATA["default"];
  const currentStory = userData.stories[currentStoryIndex];

  const nextStory = () => {
    if (currentStoryIndex < userData.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      navigate(-1); // Close if last story
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    let duration = 10000; // Default 10s for image/text
    let interval = null;

    if (currentStory.type === "video" && videoRef.current) {
      // Video logic is handled by onTimeUpdate
      return;
    }

    const step = 100; // Update every 100ms
    interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          nextStory();
          return 0;
        }
        return prev + (step / duration) * 100;
      });
    }, step);

    return () => clearInterval(interval);
  }, [currentStoryIndex]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none">
      {/* Top Progress Bars */}
      <div className="absolute top-4 left-0 right-0 px-2 flex gap-1 z-20">
        {userData.stories.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: `${index < currentStoryIndex ? 100 : index === currentStoryIndex ? progress : 0}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="absolute top-8 left-4 flex items-center gap-3 z-20 text-white">
        <button
          onClick={() => navigate(-1)}
          className="hover:bg-white/10 p-1 rounded-full"
        >
          <ChevronLeft className="size-8" />
        </button>
        <img
          src={userData.profilePic}
          className="w-10 h-10 rounded-full object-cover border border-white/20"
          alt=""
        />
        <div>
          <p className="font-semibold text-sm">{userData.fullName}</p>
          <p className="text-xs text-white/70">Today, 10:45 AM</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="ml-auto fixed right-4 top-8 p-1"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Story Content */}
      <div className="w-full h-full max-w-lg flex items-center justify-center relative">
        {/* Background Content (Image/Video/Text) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          {currentStory.type === "image" && (
            <img
              src={currentStory.url}
              className="w-full h-full object-contain"
              alt="Status"
            />
          )}

          {currentStory.type === "text" && (
            <div
              className={`w-full h-full flex items-center justify-center px-10 text-center text-3xl font-bold text-white ${currentStory.bgColor}`}
            >
              {currentStory.content}
            </div>
          )}

          {currentStory.type === "video" && (
            <video
              ref={videoRef}
              src={currentStory.url}
              autoPlay
              onEnded={nextStory}
              onTimeUpdate={handleVideoTimeUpdate}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Navigation Areas (Left/Right Tap) - Always on Top for clicks */}
        <div className="absolute inset-0 z-10 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
