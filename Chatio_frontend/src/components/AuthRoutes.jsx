import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CallProvider } from "../context/CallContext";

const LoadingScreen = () => (
  <div className="min-h-screen grid place-items-center bg-[#e8f3ef] text-[#075e54] font-semibold">
    Loading Chatio...
  </div>
);

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return isAuthenticated ? (
    <CallProvider>
      <Outlet />
    </CallProvider>
  ) : (
    <Navigate to="/" replace />
  );
};

export const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/chat" replace /> : <Outlet />;
};
