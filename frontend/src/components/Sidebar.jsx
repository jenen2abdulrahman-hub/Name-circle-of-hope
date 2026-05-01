import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <Link to="/dashboard">🏠 Home</Link>
      <Link to="/users">👥 Users</Link>
     <Link to="/resources">🧑‍⚕️ Resources</Link>
      <Link to="/profile">👤 Profile</Link>
      <Link to="/autism-guide">🧩 Autism Guide</Link>
      <Link to="/messages">💬 Messages</Link>
      <Link to="/kids-corner">🌈 Kids Corner</Link>
      <Link to="/specialist-advice">🧑‍⚕️ Specialist Advice</Link>
      <Link to="/notifications">🔔 Notifications</Link>
    </div>
  );
}

export default Sidebar;