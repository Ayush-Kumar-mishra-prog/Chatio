import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const EnterVerificationCode = () => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg">
        <div className="flex items-center justify-start mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-[#075e54]">Enter Verification Code</h1>
        <p className="text-sm text-slate-600 mb-4">
          Please enter the verification code sent to your email .
        </p>
        <input
          type="text"
          placeholder="Enter verification code"
          className="border border-emerald-200 w-full rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <Link to={'/chat'}
          type="submit"
          className="text-sm bg-[#00a884] hover:bg-[#008f72] active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 w-full justify-center mt-3"
        >
          Next <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default EnterVerificationCode;
