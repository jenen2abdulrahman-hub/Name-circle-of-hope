import React from "react";

function Rightbar() {
  return (
    <div className="rightbar">
      <h3>Support Tips</h3>

      <div className="rightbar-card">
        <p>💡 Stay consistent with routines.</p>
      </div>

      <div className="rightbar-card">
        <p>💡 Positive reinforcement helps learning.</p>
      </div>

      <div className="rightbar-card">
        <p>💡 Early intervention is key.</p>
      </div>

      <h3 style={{ marginTop: "20px" }}>Suggested Specialists</h3>

      <div className="rightbar-card">
        <p>👩‍⚕️ Speech Therapist</p>
      </div>

      <div className="rightbar-card">
        <p>👨‍⚕️ Behavioral Specialist</p>
      </div>
    </div>
  );
}

export default Rightbar;