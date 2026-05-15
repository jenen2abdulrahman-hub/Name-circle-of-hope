import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import RightbarDrawer from "./components/RightbarDrawer";
import "./App.css";

function Layout({ children }) {
  return (
    <>
      <Topbar />

      <div className="main-layout">
        <Sidebar />

        <div className="feed">{children}</div>

        <RightbarDrawer />
      </div>
    </>
  );
}

export default Layout;