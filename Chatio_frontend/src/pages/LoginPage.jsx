import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>

        <div className="rounded-lg bg-white p-6 shadow">LoginPage</div>
      </div>
    </div>
  );
};

export default LoginPage;
