import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import assets from "../assets/assets";

const LoginForm = ({ onSignUpClick }) => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate()

  const onsubmit = (data) => {
    if (data.email === "admin@gmail.com" && data.password === "admin") {
        navigate('/upload-media')
      toast.success("Login Successfully");

    } else {
      toast.error("Invalid email id or Password");
    }
  };
  const handleGoogleForm = ()=>{
    navigate('/chat')
    toast.success("Login Successfully with Google");
  }
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#075e54]">Welcome to Chatio</h2>
      <p className="text-gray-600 mb-6">Please sign in to your account</p>
       <div className="mb-4">
          
          <button onClick={handleGoogleForm} className="text-sm bg-slate-50 text-zinc-800 hover:bg-slate-100 active:scale-95 transition  font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center  w-full justify-center gap-2">
            <img src={assets.google_icon} alt="" className="w-10" />
            Continue with Google 
            
          </button>
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
