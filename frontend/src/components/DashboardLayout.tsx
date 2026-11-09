
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import "../styles/Dashboard.css";

const DashboardLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        abierto={menuAbierto}
        cerrar={() => setMenuAbierto(false)}
      />

      <div className="dashboard-main">
        <Navbar
          abrirMenu={() => setMenuAbierto(true)}
        />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
