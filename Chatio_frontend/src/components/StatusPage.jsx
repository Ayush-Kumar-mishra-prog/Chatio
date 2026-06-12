import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronUp,
  Eye,
  ImagePlus,
  Send,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { createStatus, getStatuses, markStatusViewed } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { asId } from "../lib/utils";

const MAX_STATUS_IMAGE_SIZE = 5 * 1024 * 1024;
const STORY_DURATION = 6000;

const StatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, socket } = useAuth();
  const fileInputRef = useRef(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const consumedTargetUserRef = useRef(null);

  const groups = useMemo(() => {
    const grouped = statuses.reduce((acc, status) => {
      const owner = status.userId || {};
      const key = asId(owner._id || status.userId);
      if (!key) return acc;
      acc[key] ||= { user: owner, items: [] };
      acc[key].items.push(status);
      return acc;
    }, {});
    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.items.at(-1)?.createdAt || 0) -
        new Date(a.items.at(-1)?.createdAt || 0),
    );
  }, [statuses]);

  const selectedGroup =
    selectedUserIndex === null ? null : groups[selectedUserIndex];
  const selectedStatus = selectedGroup?.items?.[statusIndex];
  const isOwnStatus =
    asId(selectedGroup?.user?._id) === asId(user?._id);

  const loadStatuses = useCallback(async () => {
    try {
      const { data } = await getStatuses();
      setStatuses(data.statuses || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load statuses");
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleStatusNew = (status) => {
      setStatuses((current) => {
        const exists = current.some((item) => asId(item._id) === asId(status._id));
        if (exists) return current;
        return [...current, status];
      });
    };

    const handleStatusViewed = (status) => {
      setStatuses((current) =>
        current.map((item) =>
          asId(item._id) === asId(status._id) ? status : item,
        ),
      );
    };

    socket.on("status:new", handleStatusNew);
    socket.on("status:viewed", handleStatusViewed);

    return () => {
      socket.off("status:new", handleStatusNew);
      socket.off("status:viewed", handleStatusViewed);
    };
  }, [socket]);

  useEffect(() => {
    const targetUserId = location.state?.userId;
    if (targetUserId !== consumedTargetUserRef.current) {
      consumedTargetUserRef.current = null;
    }
    if (targetUserId && consumedTargetUserRef.current === targetUserId) return;
    if (!targetUserId || !groups.length) return;
    const index = groups.findIndex(
      (group) => asId(group.user?._id) === asId(targetUserId),
    );
    if (index >= 0) {
      consumedTargetUserRef.current = targetUserId;
      setSelectedUserIndex(index);
      setStatusIndex(0);
    }
  }, [location.state?.userId, groups]);

  const goNext = useCallback(() => {
    if (!selectedGroup) return;
    setShowViewers(false);
    if (statusIndex < selectedGroup.items.length - 1) {
      setStatusIndex((index) => index + 1);
      return;
    }
    setSelectedUserIndex(null);
    setStatusIndex(0);
  }, [selectedGroup, statusIndex]);

  const goPrevious = useCallback(() => {
    setShowViewers(false);
    if (statusIndex > 0) {
      setStatusIndex((index) => index - 1);
      return;
    }
    if (selectedUserIndex > 0) {
      const previousGroup = groups[selectedUserIndex - 1];
      setSelectedUserIndex((index) => index - 1);
      setStatusIndex(Math.max(previousGroup.items.length - 1, 0));
    }
  }, [groups, selectedUserIndex, statusIndex]);

  useEffect(() => {
    if (!selectedStatus || showViewers) return undefined;

    if (!isOwnStatus) {
      markStatusViewed(selectedStatus._id)
        .then(({ data }) => {
          if (data?.status) {
            setStatuses((current) =>
              current.map((item) =>
                asId(item._id) === asId(data.status._id) ? data.status : item,
              ),
            );
          }
        })
        .catch(() => {});
    }

    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / STORY_DURATION) * 100, 100));
    }, 50);

    const timer = setTimeout(() => goNext(), STORY_DURATION);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [selectedStatus?._id, isOwnStatus, showViewers, goNext]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_STATUS_IMAGE_SIZE) {
      toast.error("Status image must be 5 MB or less");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const submitStatus = async () => {
    try {
      setIsSaving(true);
      const payload = image
        ? { type: "image", image, text }
        : { type: "text", text, background: "#075e54" };
      const { data } = await createStatus(payload);
      if (data?.status) {
        setStatuses((current) => [...current, data.status]);
      }
      setText("");
      setImage("");
      toast.success("Status posted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post status");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnviewed = (group) =>
    group.items.some(
      (status) =>
        !status.viewers?.some(
          (viewer) => asId(viewer._id || viewer) === asId(user?._id),
        ),
    );

  if (selectedStatus) {
    const viewers = selectedStatus.viewers || [];
    return (
      <div
        className="h-screen bg-[#111b21] text-white flex flex-col"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          if (x < rect.width * 0.35) goPrevious();
          else if (x > rect.width * 0.65) goNext();
        }}
      >
        <div className="p-4 flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedUserIndex(null);
              setStatusIndex(0);
              setShowViewers(false);
            }}
            className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10"
          >
            <X className="size-6" />
          </button>
          <img
            src={selectedGroup.user?.image || assets.avatar_icon}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {isOwnStatus ? "My status" : selectedGroup.user?.name || "Status"}
            </p>
            <p className="text-xs text-white/60">
              {new Date(selectedStatus.createdAt).toLocaleString()}
            </p>
          </div>
          {isOwnStatus && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowViewers((value) => !value);
              }}
              className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <Eye className="size-4" />
              {viewers.length}
            </button>
          )}
        </div>

        <div className="px-4 flex gap-1 relative z-10">
          {selectedGroup.items.map((item, index) => (
            <span key={item._id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
              <span
                className="block h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < statusIndex
                      ? "100%"
                      : index === statusIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </span>
          ))}
        </div>

        <div className="relative flex-1 grid place-items-center overflow-hidden">
          {selectedStatus.image ? (
            <img
              src={selectedStatus.image}
              alt=""
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
          ) : (
            <div
              className="h-full w-full grid place-items-center px-8 text-center pointer-events-none"
              style={{ background: selectedStatus.background }}
            >
              <p className="text-3xl font-semibold">{selectedStatus.text}</p>
            </div>
          )}
          {selectedStatus.image && selectedStatus.text && (
            <div className="absolute bottom-12 max-w-xl px-5 py-3 rounded-md bg-black/55 text-center pointer-events-none">
              {selectedStatus.text}
            </div>
          )}
        </div>

        {isOwnStatus && showViewers && (
          <div
            className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#1f2c34] rounded-t-2xl z-20 flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-center py-2">
              <span className="h-1 w-10 rounded-full bg-white/30" />
            </div>
            <div className="px-4 pb-2 flex items-center gap-2 border-b border-white/10">
              <Eye className="size-5 text-white/70" />
              <p className="font-semibold">
                Viewed by {viewers.length}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {!viewers.length && (
                <p className="text-center text-white/50 py-8 text-sm">
                  No views yet
                </p>
              )}
              {viewers.map((viewer) => (
                <div
                  key={asId(viewer._id)}
                  className="flex items-center gap-3 px-2 py-3"
                >
                  <img
                    src={viewer.image || assets.avatar_icon}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="font-medium">{viewer.name || "User"}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowViewers(false)}
              className="p-4 text-center text-[#00a884] font-medium border-t border-white/10"
            >
              <ChevronUp className="size-5 mx-auto mb-1" />
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  const myGroup = groups.find(
    (group) => asId(group.user?._id) === asId(user?._id),
  );
  const otherGroups = groups.filter(
    (group) => asId(group.user?._id) !== asId(user?._id),
  );

  return (
    <div className="h-screen bg-[#f0f2f5] flex justify-center">
      <div className="h-full w-full max-w-3xl bg-white flex flex-col relative">
        <div className="h-16 bg-[#075e54] text-white flex items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10"
          >
            <ArrowLeft />
          </button>
          <p className="font-semibold">Status</p>
        </div>

        <div className="p-4 border-b border-emerald-100">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-14 w-14 rounded-full bg-slate-100 shrink-0"
            >
              <img
                src={user?.image || assets.avatar_icon}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#00a884] text-white grid place-items-center border-2 border-white">
                <Camera className="size-3.5" />
              </span>
            </button>
            <div>
              <p className="font-semibold">My status</p>
              <p className="text-sm text-slate-500">
                Tap the camera or type below to add a status
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 rounded-full bg-[#00a884] text-white grid place-items-center shrink-0"
            >
              {image ? <Camera /> : <ImagePlus />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
            <div className="flex-1 rounded-2xl border border-emerald-100 overflow-hidden">
              {image && (
                <div className="relative">
                  <img
                    src={image}
                    alt="Status preview"
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/50 text-white grid place-items-center"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 px-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={image ? "Add a caption" : "Type a status"}
                  className="h-12 flex-1 outline-none text-sm"
                />
                <button
                  type="button"
                  disabled={isSaving || (!text.trim() && !image)}
                  onClick={submitStatus}
                  className="h-10 w-10 rounded-full bg-[#00a884] text-white grid place-items-center disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {myGroup && (
            <button
              type="button"
              onClick={() => {
                const index = groups.findIndex(
                  (group) => asId(group.user?._id) === asId(user?._id),
                );
                setSelectedUserIndex(index);
                setStatusIndex(0);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
            >
              <span className="h-14 w-14 rounded-full border-2 border-slate-300 p-0.5">
                <img
                  src={user?.image || assets.avatar_icon}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">My status</span>
                <span className="block text-sm text-slate-500">
                  {myGroup.items.length} update
                  {myGroup.items.length > 1 ? "s" : ""} · Tap to view who saw
                </span>
              </span>
            </button>
          )}

          {!!otherGroups.length && (
            <p className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Recent updates
            </p>
          )}

          {otherGroups.map((group) => {
            const latest = group.items.at(-1);
            const unviewed = hasUnviewed(group);
            const index = groups.findIndex(
              (item) => asId(item.user?._id) === asId(group.user?._id),
            );
            return (
              <button
                key={asId(group.user?._id)}
                type="button"
                onClick={() => {
                  setSelectedUserIndex(index);
                  setStatusIndex(0);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
              >
                <span
                  className={`h-14 w-14 rounded-full p-0.5 ${unviewed ? "border-2 border-[#25d366]" : "border-2 border-slate-300"}`}
                >
                  <img
                    src={group.user?.image || assets.avatar_icon}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium truncate">
                    {group.user?.name || "Contact"}
                  </span>
                  <span className="block text-sm text-slate-500 truncate">
                    {latest?.text || (latest?.image ? "Photo" : "Status update")}
                  </span>
                </span>
              </button>
            );
          })}

          {!groups.length && (
            <p className="py-10 text-center text-sm text-slate-500">
              No statuses yet. Add your first status above.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-[#00a884] text-white shadow-lg grid place-items-center hover:bg-[#008f72]"
          title="Add status"
        >
          <Camera className="size-6" />
        </button>
      </div>
    </div>
  );
};

export default StatusPage;
