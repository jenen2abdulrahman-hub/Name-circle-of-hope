import { useState } from "react";
import Rightbar from "./Rightbar";

function RightbarDrawer() {
  const [showTips, setShowTips] = useState(true);

  return (
    <div className={`rightbar-drawer ${showTips ? "open" : "closed"}`}>
      <button className="drawer-tab" onClick={() => setShowTips(!showTips)}>
        {showTips ? "›" : "‹"}
      </button>

      <Rightbar />
    </div>
  );
}

export default RightbarDrawer;