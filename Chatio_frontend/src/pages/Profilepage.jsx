import { useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";

const Profilepage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState("Ayush");
  const [bio, setBio] = useState("Chatio");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSumbit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    navigate("/");
    setIsSaving(false);
  };
  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center p-6">
      <div className="w-5/6 max-w-2xl bg-white/90 backdrop-blur-2xl shadow-lg flex items-center justify-between max-sm:flex-col-reverse rounded-lg border border-emerald-100">
        <form
          onSubmit={handleSumbit}
          action=""
          className="flex flex-col  gap-5 p-10 flex-1"
        >
          <h3 className="text-xl text-center text-[#075e54] font-semibold">
            Profile Details
          </h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              onChange={(e) => setSelectedImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept="image/*"
              hidden
              className=""
            />
            <img
              src={
                selectedImage
                  ? URL.createObjectURL(selectedImage)
                  : assets.avatar_icon
              }
              alt=""
              className={`w-12 object-cover h-12 ${selectedImage && "rounded-full"}`}
            />
            Upload Profile image
          </label>
          <input
            type="text"
            required
            placeholder="Your Name"
            className="p-2 border border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            name=""
            id=""
            required
            placeholder="Write profile bio"
            className="p-2 border border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            rows={4}
          ></textarea>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#00a884] hover:bg-[#008f72] text-white p-2 rounded-full text-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </form>
        <img
          src={assets.main_logo_}
          alt=""
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10"
        />
      </div>
    </div>
  );
};

export default Profilepage;
