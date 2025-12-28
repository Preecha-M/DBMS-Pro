import { Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen w-full bg-[#F4F7FE] flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-[1000]">
        <Navbar/>
      </div>
      
      <div className="fixed top-[70px] left-0 bottom-0 z-[900]">
        <Sidebar/>
      </div>
      
      <main className="pt-[70px] pl-[100px] min-h-screen">
        <div className="min-h-[calc(100vh-70px)] overflow-y-auto">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}
