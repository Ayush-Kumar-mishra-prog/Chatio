import { useRef, useState } from "react";
import { ArrowRight, ArrowLeft, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const UploadProfilePicture = () => {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-6">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg">
        <div className="flex items-center justify-start mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
        </div>
        <h1 className="text-2xl font-semibold text-[#075e54] mb-4">
          Upload Profile Picture
        </h1>
        
        <p className="text-sm text-slate-600 mb-8">
          Click the user icon to choose an image, preview it, and remove it if
          needed.
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleIconClick}
            className="group flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-emerald-200 bg-slate-50 text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-50 focus:outline-none"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                <User className="h-12 w-12 text-slate-500" />
                <span className="text-sm font-medium">Upload image</span>
              </div>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="flex w-full flex-col gap-3 text-center">
              <p className="text-sm text-slate-600">
                Image uploaded successfully. Preview shown above.
              </p>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Remove image
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <p className="text-sm">No image selected yet.</p>
            </div>
          )}
          <Link
            to="/"
            type="submit"
            className="text-sm bg-[#00a884] hover:bg-[#008f72] active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center mt-3"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UploadProfilePicture;
