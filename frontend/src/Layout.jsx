import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import "./App.css";

function Layout({ children }) {
  return (
    <>
      <Topbar />

      <div className="main-layout">
        <Sidebar />

        <div className="feed">
          {children}
        </div>

        <Rightbar />
      </div>
    </>
  );
}

export default Layout;