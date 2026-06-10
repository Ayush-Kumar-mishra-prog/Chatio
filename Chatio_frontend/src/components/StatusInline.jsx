import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Eye, ImagePlus, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { createStatus, markStatusViewed } from "../api/api";
import { asId } from "../lib/utils";

const MAX_STATUS_IMAGE_SIZE = 5 * 1024 * 1024;
const STORY_DURATION = 6000;

const StatusAddModal = ({ open, onClose, user, onCreated }) => {
  const fileInputRef = useRef(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setImage("");
    }
  }, [open]);

  if (!open) return null;

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
      onCreated?.(data.status);
      setText("");
      setImage("");
      toast.success("Status posted");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="font-semibold text-[#075e54]">Add status</p>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-[#00a884] text-[#075e54] font-medium hover:bg-emerald-50"
          >
            <ImagePlus className="size-5" />
            {image ? "Change photo" : "Add photo from gallery"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          {image && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={image} alt="Preview" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage("")}
                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/50 text-white grid place-items-center"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 px-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={image ? "Add a caption (optional)" : "Type a status"}
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
  );
};

const StatusStoryViewer = ({ group, currentUserId, onClose, onFinish, onStatusUpdated }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const statusIndexRef = useRef(0);
  statusIndexRef.current = statusIndex;

  const selectedStatus = group?.items?.[statusIndex];
  const isOwnStatus = asId(group?.user?._id || group?._id) === asId(currentUserId);

  const finishViewer = useCallback(() => {
    onClose();
    onFinish?.();
  }, [onClose, onFinish]);

  const goNext = useCallback(() => {
    setShowViewers(false);
    const currentIndex = statusIndexRef.current;
    if (currentIndex < group.items.length - 1) {
      setStatusIndex(currentIndex + 1);
      return;
    }
    finishViewer();
  }, [group?.items?.length, finishViewer]);

  useEffect(() => {
    if (!selectedStatus || showViewers) return undefined;

    if (!isOwnStatus) {
      markStatusViewed(selectedStatus._id)
        .then(({ data }) => {
          if (data?.status) onStatusUpdated?.(data.status);
        })
        .catch(() => {});
    }

    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / STORY_DURATION) * 100, 100));
    }, 50);
    const timer = setTimeout(() => goNext(), STORY_DURATION);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [selectedStatus?._id, isOwnStatus, showViewers, goNext, onStatusUpdated]);

  if (!selectedStatus) return null;

  const viewers = selectedStatus.viewers || [];
  const owner = group.user || group;

  return (
    <div className="fixed inset-0 z-[65] bg-[#111b21] text-white flex flex-col">
      <div className="p-4 flex items-center gap-3 relative z-10">
        <button
          type="button"
          onClick={finishViewer}
          className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10"
        >
          <X className="size-6" />
        </button>
        <img src={owner.image || assets.avatar_icon} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{isOwnStatus ? "My status" : owner.name || "Status"}</p>
          <p className="text-xs text-white/60">{new Date(selectedStatus.createdAt).toLocaleString()}</p>
        </div>
        {isOwnStatus && (
          <button
            type="button"
            onClick={() => setShowViewers((value) => !value)}
            className="flex items-center gap-1 text-sm"
          >
            <Eye className="size-4" />
            {viewers.length}
          </button>
        )}
      </div>

      <div className="px-4 flex gap-1 relative z-10">
        {group.items.map((item, index) => (
          <span key={item._id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
            <span
              className="block h-full bg-white transition-all duration-100"
              style={{
                width: index < statusIndex ? "100%" : index === statusIndex ? `${progress}%` : "0%",
              }}
            />
          </span>
        ))}
      </div>

      <div
        className="relative flex-1 grid place-items-center overflow-hidden"
        onClick={(event) => {
          if (showViewers) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          if (x < rect.width * 0.35 && statusIndex > 0) {
            setStatusIndex((index) => Math.max(index - 1, 0));
          } else {
            goNext();
          }
        }}
      >
        {selectedStatus.image ? (
          <img src={selectedStatus.image} alt="" className="max-h-full max-w-full object-contain pointer-events-none" />
        ) : (
          <div
            className="h-full w-full grid place-items-center px-8 text-center pointer-events-none"
            style={{ background: selectedStatus.background || "#075e54" }}
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
          className="absolute inset-x-0 bottom-0 max-h-[50%] bg-[#1f2c34] rounded-t-2xl z-20"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-white/10 font-semibold flex items-center gap-2">
            <Eye className="size-4" />
            Viewed by {viewers.length}
          </div>
          <div className="overflow-y-auto max-h-48 p-2">
            {!viewers.length && <p className="text-center text-white/50 py-6 text-sm">No views yet</p>}
            {viewers.map((viewer) => (
              <div key={asId(viewer._id)} className="flex items-center gap-3 px-2 py-2">
                <img src={viewer.image || assets.avatar_icon} alt="" className="h-9 w-9 rounded-full object-cover" />
                <span>{viewer.name || "User"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { StatusAddModal, StatusStoryViewer };
