import { useState } from "react";
import assets from "../assets/assets";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";

const HomePage = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full backdrop-blur-sm bg-white">
      {/* Left side */}
      <div className="flex-1 flex flex-col items-start justify-center p-6 md:p-10 lg:pl-40">
        <div className="flex justify-center items-center">
        <img
          src={assets.main_logo_}
          alt=""
          className="w-30 h-30 object-cover sm:h-30 sm:w-30"
        />
        <p className="text-3xl font-bold text-purple-900">Chatio</p>
        </div>
        <p className=" hidden md:block text-2xl font-bold text-purple-600 ">
          <span className="text-2xl text-green-400">Simple, Secure and seamless communication </span> through messages,voice calls and video callls.</p>

        <div className="mt-10 w-full max-w-md">
          <img
            src={assets.section_image_login}
            alt=""
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* Right side Form */}
      <div className="flex-1 shadow-md flex items-center justify-center p-6 sm:p-10">
        {isSignUp ? (
          <SignUpForm onLoginClick={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onSignUpClick={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
