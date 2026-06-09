import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, ImagePlus, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { createStatus, getStatuses, markStatusViewed } from "../api/api";
import { useAuth } from "../context/AuthContext";

const MAX_STATUS_IMAGE_SIZE = 5 * 1024 * 1024;

const StatusPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const groups = useMemo(() => {
    const grouped = statuses.reduce((acc, status) => {
      const owner = status.userId || {};
      const key = owner._id || status.userId;
      if (!key) return acc;
      acc[key] ||= { user: owner, items: [] };
      acc[key].items.push(status);
      return acc;
    }, {});
    return Object.values(grouped).sort(
      (a, b) => new Date(b.items.at(-1)?.createdAt || 0) - new Date(a.items.at(-1)?.createdAt || 0),
    );
  }, [statuses]);

  const selectedGroup = selectedUserIndex === null ? null : groups[selectedUserIndex];
  const selectedStatus = selectedGroup?.items?.[statusIndex];

  const loadStatuses = async () => {
    try {
      const { data } = await getStatuses();
      setStatuses(data.statuses || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load statuses");
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  useEffect(() => {
    if (!selectedStatus) return undefined;
    markStatusViewed(selectedStatus._id).catch(() => {});
    const timer = setTimeout(() => goNext(), 5000);
    return () => clearTimeout(timer);
  }, [selectedStatus?._id]);

  const goNext = () => {
    if (!selectedGroup) return;
    if (statusIndex < selectedGroup.items.length - 1) {
      setStatusIndex((index) => index + 1);
      return;
    }
    if (selectedUserIndex < groups.length - 1) {
      setSelectedUserIndex((index) => index + 1);
      setStatusIndex(0);
      return;
    }
    setSelectedUserIndex(null);
    setStatusIndex(0);
  };

  const goPrevious = () => {
    if (statusIndex > 0) {
      setStatusIndex((index) => index - 1);
      return;
    }
    if (selectedUserIndex > 0) {
      const previousGroup = groups[selectedUserIndex - 1];
      setSelectedUserIndex((index) => index - 1);
      setStatusIndex(Math.max(previousGroup.items.length - 1, 0));
    }
  };

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
      await createStatus(payload);
      setText("");
      setImage("");
      toast.success("Status posted");
      loadStatuses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post status");
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedStatus) {
    return (
      <div className="h-screen bg-[#111b21] text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => setSelectedUserIndex(null)} className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10">
            <X className="size-6" />
          </button>
          <img src={selectedGroup.user?.image || assets.avatar_icon} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{selectedGroup.user?.name || "Status"}</p>
            <p className="text-xs text-white/60">{new Date(selectedStatus.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="px-4 flex gap-1">
          {selectedGroup.items.map((item, index) => (
            <span key={item._id} className={`h-1 flex-1 rounded-full ${index <= statusIndex ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
        <div className="relative flex-1 grid place-items-center overflow-hidden">
          <button onClick={goPrevious} className="absolute left-3 h-12 w-12 rounded-full bg-black/30 grid place-items-center">
            <ChevronLeft />
          </button>
          {selectedStatus.image ? (
            <img src={selectedStatus.image} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="h-full w-full grid place-items-center px-8 text-center" style={{ background: selectedStatus.background }}>
              <p className="text-3xl font-semibold">{selectedStatus.text}</p>
            </div>
          )}
          {selectedStatus.image && selectedStatus.text && (
            <div className="absolute bottom-12 max-w-xl px-5 py-3 rounded-md bg-black/55 text-center">
              {selectedStatus.text}
            </div>
          )}
          <button onClick={goNext} className="absolute right-3 h-12 w-12 rounded-full bg-black/30 grid place-items-center">
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f0f2f5] flex justify-center">
      <div className="h-full w-full max-w-3xl bg-white flex flex-col relative">
        <div className="h-16 bg-[#075e54] text-white flex items-center gap-4 px-4">
          <button onClick={() => navigate("/chat")} className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10">
            <ArrowLeft />
          </button>
          <p className="font-semibold">Status</p>
        </div>

        <div className="p-4 border-b border-emerald-100">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-14 w-14 rounded-full bg-slate-100"
            >
              <img src={user?.image || assets.avatar_icon} alt="" className="h-full w-full rounded-full object-cover" />
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#00a884] text-white grid place-items-center border-2 border-white">
                <Camera className="size-3.5" />
              </span>
            </button>
            <div>
              <p className="font-semibold">My status</p>
              <p className="text-sm text-slate-500">Tap the camera or type below to add a status</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-full bg-[#00a884] text-white grid place-items-center">
              {image ? <Camera /> : <ImagePlus />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
            <div className="flex-1 rounded-2xl border border-emerald-100 overflow-hidden">
              {image && (
                <div className="relative">
                  <img src={image} alt="Status preview" className="h-40 w-full object-cover" />
                  <button onClick={() => setImage("")} className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/50 text-white grid place-items-center">
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
                <button disabled={isSaving || (!text.trim() && !image)} onClick={submitStatus} className="h-10 w-10 rounded-full bg-[#00a884] text-white grid place-items-center disabled:opacity-50">
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.map((group, index) => {
            const latest = group.items.at(-1);
            return (
              <button
                key={group.user?._id}
                onClick={() => {
                  setSelectedUserIndex(index);
                  setStatusIndex(0);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
              >
                <span className="h-14 w-14 rounded-full border-2 border-[#25d366] p-0.5">
                  <img src={group.user?.image || assets.avatar_icon} alt="" className="h-full w-full rounded-full object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium truncate">{group.user?._id === user?._id ? "My status" : group.user?.name}</span>
                  <span className="block text-sm text-slate-500 truncate">{latest?.text || (latest?.image ? "Photo" : "Status update")}</span>
                </span>
              </button>
            );
          })}
          {!groups.length && <p className="py-10 text-center text-sm text-slate-500">No statuses yet</p>}
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
