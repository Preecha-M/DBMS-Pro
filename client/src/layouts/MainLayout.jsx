import { Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Navbar/>
      <div className="main-wrapper">
        <Sidebar/>
        <main className="pos-shell">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
