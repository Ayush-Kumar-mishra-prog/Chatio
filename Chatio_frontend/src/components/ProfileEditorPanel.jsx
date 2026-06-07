import { useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { updateProfile } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ProfileEditorPanel = ({ onBack }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    image: user?.image || "",
  });

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await updateProfile(form);
      updateUser(result.data.user);
      toast.success("Profile updated");
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="h-16 bg-[#075e54] text-white flex items-center gap-4 px-4">
        <button type="button" onClick={onBack} title="Back" className="h-10 w-10 rounded-full grid place-items-center hover:bg-white/10">
          <ArrowLeft className="size-5" />
        </button>
        <p className="font-semibold">Profile</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-36 w-36 rounded-full overflow-hidden bg-slate-100"
            title="Change profile picture"
          >
            <img src={form.image || assets.avatar_icon} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-black/35 text-white grid place-items-center opacity-0 hover:opacity-100 transition">
              <Camera className="size-7" />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-[#00a884]">Your name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
            className="mt-2 w-full border-b border-emerald-200 py-3 outline-none focus:border-[#00a884]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-[#00a884]">About</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            rows={4}
            className="mt-2 w-full resize-none border-b border-emerald-200 py-3 outline-none focus:border-[#00a884]"
          />
        </label>

        <button type="submit" className="w-full rounded-full bg-[#00a884] py-3 text-sm font-semibold text-white hover:bg-[#008f72]">
          Save profile
        </button>
      </form>
    </div>
  );
};

export default ProfileEditorPanel;
