import assets from "../assets/assets";

const SignUpForm = ({ onLoginClick }) => {
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#075e54]">Welcome to Chatio</h2>
      <p className="text-gray-600 mb-6">Please sign up for an account</p>
       <div className="mb-4">
          <button className="text-sm bg-slate-50 text-zinc-800 border border-gray-300 hover:bg-gray-100 active:scale-95 transition  font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center">
            <img
              src={assets.google_icon}
              alt="Google icon"
              className="w-10"
            />
            Continue with Google
          </button>
        </div>
      <form className="space-y-6">
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
              id="firstName"
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
              id="lastName"
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
            className="text-sm bg-[#00a884] hover:bg-[#008f72] active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center"
          >
            Sign up
          </button>
        </div>
       
      </form>
    </div>
  );
};

export default SignUpForm;
