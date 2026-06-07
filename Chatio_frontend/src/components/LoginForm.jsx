import { useForm } from "react-hook-form";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import assets from "../assets/assets";
import { useGoogleLogin } from "@react-oauth/google";
import { facebookAuth, googleAuth, loginUser } from "../api/api";
import FacebookLoginModule from "@greatsumini/react-facebook-login";
import { useAuth } from "../context/AuthContext";

const FacebookLogin = FacebookLoginModule?.default ?? FacebookLoginModule;

const LoginForm = ({ onSignUpClick }) => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const facebookTokenRef = useRef("");

  const onsubmit = async (data) => {
    try {
      const result = await loginUser(data);
      saveSession(result.data.token, result.data.user);
      navigate("/chat", { replace: true });
      toast.success("Login Successfully");
    } catch (error) {
      const response = error.response?.data;
      if (response?.needsVerification) {
        navigate("/verification", { state: { email: response.email } });
        toast.info("Please verify your email first");
        return;
      }
      toast.error(response?.message || "Invalid email id or Password");
    }
  };
  const handleGoogleForm = async (authResult) => {
    try {
      if (authResult?.code) {
        const result = await googleAuth(authResult.code);
        saveSession(result.data.token, result.data.user);
        navigate("/chat", { replace: true });
        toast.success("Logged in successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Google Login Failed");
    }
  };
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleForm,
    onError: (err) => {
      console.error("Google login SDK error:", err);
      toast.error("Google Login Failed");
    },
    flow: "auth-code",
  });

  const handleFacebookLogin = async (response) => {
    try {
      const result = await facebookAuth({
        accessToken: response.accessToken || facebookTokenRef.current,
        facebookId: response.id,
        name: response.name,
        email: response.email,
        image: response.picture?.data?.url,
      });
      saveSession(result.data.token, result.data.user);
      navigate("/chat", { replace: true });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Facebook Login Failed");
    }
  }
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#075e54]">
        Welcome to Chatio
      </h2>
      <p className="text-gray-600 mb-6">Please sign in to your account</p>
      <div className="mb-4 flex flex-col gap-4">
        <button
          className="text-sm bg-slate-50 text-zinc-800 border border-gray-300 hover:bg-gray-100 active:scale-95 transition  font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
          onClick={googleLogin}
        >
          <img src={assets.google_icon} alt="Google icon" className="w-10" />
          Continue with Google
        </button>
        <div className="relative flex justify-center item-center">
        <img src={assets.facebook_icon} alt="facebook icon" className="w-10 absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 ml-3" />
        <FacebookLogin className='w-full flex items-center justify-center cursor-pointer rounded-md border border-gray-300 hover:bg-gray-100 active:scale-95 transition'
          appId={import.meta.env.VITE_FB_APP_ID}
          scope="public_profile,email"
          style={{
            backgroundColor: "white",
            color: "puprle",
            fontSize: "16px",
            padding: "12px 24px",
            border: "none",
            borderRadius: "4px",
          }}
          onSuccess={(response) => {
            if (response?.accessToken) {
              facebookTokenRef.current = response.accessToken;
            }
          }}
          onFail={(error) => {
            console.log("Login Failed!", error);
          }}
          onProfileSuccess={handleFacebookLogin}
        />
        </div>
      </div>
      <form className="space-y-6 " onSubmit={handleSubmit(onsubmit)}>
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
            className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your email"
            {...register("email")}
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
            className="mt-1 block w-full px-3 py-2 border border-emerald-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your password"
            {...register("password")}
          />
          <p className="text-sm text-gray-600 mt-2">
            Don't have an account?
            <span
              onClick={onSignUpClick}
              className="text-[#00a884] font-medium hover:text-[#075e54] cursor-pointer"
            >
              {" "}
              Sign up
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="text-sm bg-[#00a884] hover:bg-[#008f72] active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
