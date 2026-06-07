import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Profilepage from "./pages/Profilepage";
import EnterVerificationCode from "./pages/EnterVerificationCode";
import ChatPage from "./pages/ChatPage";
import StatusPage from './components/StatusPage'
import LoginFailedPage from "./pages/LoginFailedPage";
import PageNotFound from "./pages/PageNotFound";
import { ProtectedRoute, PublicOnlyRoute } from "./components/AuthRoutes";

const App = () => {
  return (
    <div>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verification" element={<EnterVerificationCode />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/profile" element={<Profilepage />} />
        </Route>
        <Route path="/login-failed" element={<LoginFailedPage />}/>
        <Route path="/page-not-found" element={<PageNotFound />}/>
        <Route path="*" element={<PageNotFound />}/>
      </Routes>
    </div>
  );
};

export default App;
