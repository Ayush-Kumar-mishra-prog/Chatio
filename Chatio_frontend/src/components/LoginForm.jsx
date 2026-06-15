import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
  const [isCredentialLoading, setIsCredentialLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const facebookTokenRef = useRef("");
  const isLoading = isCredentialLoading || isGoogleLoading || isFacebookLoading;

  const stopGoogleLoading = () => {
    setIsGoogleLoading(false);
  };

  const stopFacebookLoading = () => {
    setIsFacebookLoading(false);
  };

  const startGoogleLoading = () => {
    setIsGoogleLoading(true);
  };

  const startFacebookLoading = () => {
    setIsFacebookLoading(true);
  };

  useEffect(() => {
    return () => {
      stopGoogleLoading();
      stopFacebookLoading();
    };
  }, []);

  const onsubmit = async (data) => {
    try {
      setIsCredentialLoading(true);
      const result = await loginUser(data);
      saveSession(
        result.data.token,
        result.data.user,
        result.data.refreshToken,
      );
      navigate("/chat", { replace: true });
      toast.success("Logged in successfully");
    } catch (error) {
      const response = error.response?.data;
      toast.error(response?.message || "Invalid email or password");
    } finally {
      setIsCredentialLoading(false);
    }
  };
  const handleGoogleForm = async (authResult) => {
    try {
      if (!authResult?.code) {
        toast.error("Google Login Failed");
        return;
      }
      const result = await googleAuth(authResult.code);
      saveSession(
        result.data.token,
        result.data.user,
        result.data.refreshToken,
      );
      navigate("/chat", { replace: true });
      toast.success("Logged in successfully");
    } catch (error) {
      console.error(error);
      toast.error("Google Login Failed");
    } finally {
      stopGoogleLoading();
    }
  };
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleForm,
    onError: (err) => {
      console.error("Google login SDK error:", err);
      stopGoogleLoading();
      toast.error("Google Login Failed");
    },
    onNonOAuthError: (err) => {
      console.warn("Google login non-oauth error:", err);
      stopGoogleLoading();
      if (err?.type !== "popup_closed") {
        toast.error("Google Login Failed");
      }
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
      saveSession(
        result.data.token,
        result.data.user,
        result.data.refreshToken,
      );
      navigate("/chat", { replace: true });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Facebook Login Failed");
    } finally {
      stopFacebookLoading();
    }
  };
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#075e54]">
        Welcome to Chatio
      </h2>
      <p className="text-gray-600 mb-6">Please sign in to your account</p>
      <div className="mb-4 flex flex-col gap-4">
        <button
          className="text-sm bg-slate-50 text-zinc-800 border border-gray-300 hover:bg-gray-100 active:scale-95 transition  font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
          onClick={() => {
            startGoogleLoading();
            googleLogin();
          }}
          disabled={isLoading}
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2 py-1.5">
              <svg
                className="animate-spin h-5 w-5 text-[#075e54]"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Connecting...
            </div>
          ) : (
            <>
              <img
                src={assets.google_icon}
                alt="Google icon"
                className="w-10"
              />
              Continue with Google
            </>
          )}
        </button>
        <div className="relative flex justify-center item-center">
          <FacebookLogin
            appId={import.meta.env.VITE_FB_APP_ID}
            scope="public_profile,email"
            onSuccess={(response) => {
              if (response?.accessToken) {
                facebookTokenRef.current = response.accessToken;
              }
            }}
            onFail={(error) => {
              console.log("Login Failed!", error);
              stopFacebookLoading();
            }}
            onProfileSuccess={handleFacebookLogin}
            render={({ onClick }) => (
              <button
                onClick={() => {
                  startFacebookLoading();
                  onClick();
                }}
                disabled={isLoading}
                className={`w-full py-3 px-4 flex items-center justify-center cursor-pointer rounded-lg border border-[#0f5dc8] bg-[#1877f2] text-white hover:bg-[#166fe5] active:scale-[0.99] transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed`}
                style={{ fontSize: "15px" }}
              >
                {isFacebookLoading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Connecting...
                  </div>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-current"
                    >
                      <path d="M22.675 0h-21.35C.593 0 0 .592 0 1.326v21.348C0 23.408.593 24 1.326 24H12.82v-9.294H9.692V11.08h3.128V8.414c0-3.1 1.893-4.788 4.659-4.788 1.324 0 2.463.099 2.795.143v3.24H18.36c-1.5 0-1.79.714-1.79 1.762v2.31h3.579l-.466 3.626H16.57V24h6.104C23.407 24 24 23.408 24 22.674V1.326C24 .592 23.407 0 22.675 0z" />
                    </svg>
                    Continue with Facebook
                  </span>
                )}
              </button>
            )}
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
            disabled={isLoading}
          >
            {isCredentialLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
