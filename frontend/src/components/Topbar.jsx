import React from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function Topbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>Circle of Hope</h2>
      </div>

      <div className="topbar-center">
        <input
          type="text"
          placeholder="Search..."
          className="topbar-search"
        />
      </div>

      <div className="topbar-right">
        <Link to="/profile">
          <img
            src={
              user?.profile_pic
                ? `${API_BASE}${user.profile_pic}`
                : "https://via.placeholder.com/40"
            }
            className="topbar-img"
            alt="profile"
          />
        </Link>
      </div>
    </div>
  );
}

export default Topbar;