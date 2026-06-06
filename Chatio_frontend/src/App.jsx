import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Profilepage from "./pages/Profilepage";
import UploadProfilePicture from "./pages/UploadProfilePicture";
import EnterVerificationCode from "./pages/EnterVerificationCode";
import ChatPage from "./pages/ChatPage";
import StatusPage from './components/StatusPage'
import LoginFailedPage from "./pages/LoginFailedPage";
import PageNotFound from "./pages/PageNotFound";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<Profilepage />} />
        <Route path="/upload-media" element={<UploadProfilePicture  />} />
        <Route path="/verification" element={<EnterVerificationCode />} />
        <Route path="/chat" element={<ChatPage />} /> 
        <Route path="/status" element={<StatusPage />} />
        <Route path="/login-failed" element={<LoginFailedPage />}/>
        <Route path="/page-not-found" element={<PageNotFound />}/>
      </Routes>
    </div>
  );
};

export default App;
