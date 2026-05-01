import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import ProfilePage from "./ProfilePage";
import Resources from "./Resources";
import UserPage from "./UserPage";
import AdminDashboard from "./AdminDashboard";
import AutismGuide from "./AutismGuide";
import Messages from "./Messages";
import Notifications from "./Notifications";
import KidsCorner from "./KidsCorner";
import SpecialistAdvice from "./SpecialistAdvice";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/autism-guide" element={<AutismGuide />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/kids-corner" element={<KidsCorner />} />
        <Route path="/specialist-advice" element={<SpecialistAdvice />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;