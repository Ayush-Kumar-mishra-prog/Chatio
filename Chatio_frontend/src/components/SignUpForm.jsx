import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { googleAuth, signupUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

const SignUpForm = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { saveSession } = useAuth();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    email: "",
    password: "",
    image: "",
  });
  const [preview, setPreview] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setForm((current) => ({ ...current, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview("");
    setForm((current) => ({ ...current, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleForm = async (authResult) => {
    try {
      if (!authResult?.code) return;
      setIsLoading(true);
      const result = await googleAuth(authResult.code);
      saveSession(result.data.token, result.data.user, result.data.refreshToken);
      navigate("/chat", { replace: true });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error("Google signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleForm,
    onError: () => toast.error("Google signup failed"),
    flow: "auth-code",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const result = await signupUser(form);
      toast.success(result.data.message || "Verification code sent");
      navigate("/verification", { state: { email: form.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#075e54]">
        Welcome to Chatio
      </h2>
      <p className="text-gray-600 mb-6">Please sign up for an account</p>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            googleLogin();
          }}
          disabled={isLoading}
          className="text-sm bg-slate-50 text-zinc-800 border border-gray-300 hover:bg-gray-100 active:scale-95 transition  font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
        >
          <img src={assets.google_icon} alt="Google icon" className="w-10" />
          {isLoading ? "Please wait..." : "Continue with Google"}
        </button>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-20 w-20 shrink-0 rounded-full border-2 border-dashed border-emerald-200 bg-slate-50 grid place-items-center overflow-hidden"
            title="Upload profile picture"
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="size-7 text-[#075e54]" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">
              Profile picture
            </p>
            <p className="text-xs text-slate-500">
              Add a photo for your chat profile.
            </p>
            {preview && (
              <button
                type="button"
                onClick={removeImage}
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-500"
              >
                <X className="size-3" /> Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              required
              className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Bio
            </label>
            <input
              type="text"
              id="bio"
              name="bio"
              value={form.bio}
              onChange={updateField}
              className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your bio text here"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={updateField}
            required
            className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={updateField}
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your password"
          />
          <p className="text-sm text-gray-600 mt-2">
            Already have an account?
            <span
              onClick={onLoginClick}
              className="text-[#00a884] font-medium hover:text-[#075e54] cursor-pointer"
            >
              {" "}
              Login
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="text-sm bg-[#00a884] hover:bg-[#008f72] active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
          >
            {isLoading ? (
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
                Signing up...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
