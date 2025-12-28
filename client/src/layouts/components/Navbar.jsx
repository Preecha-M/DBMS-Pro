import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth()
  
  const navigate = useNavigate()
  const userMenuRef = useRef(null);
  
  const [openUser, setOpenUser] = useState(false);
  
  const isAdmin = ["Admin", "Manager"].includes(user.role);
  
  useEffect(() => {
    const onDoc = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  
  const onLogout = async () => {
    setOpenUser(false);
    await logout();
    navigate("/login", { replace: true });
  };
  
  const goNewOrder = () => navigate("/new-order");
  
  if (!user) return null;

  return (
    <header className="h-[70px] w-full bg-white border-b border-[#E5E6EB] px-6 md:px-10 flex items-center justify-between sticky top-0 z-[1000]">
      <div className="pos-brand" onClick={() => navigate("/home")}>
        Easy <span>POS</span>
      </div>

      <nav className="pos-topnav" style={{ flex: 1, justifyContent: "center" }}>
        <NavLink to="/home" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}>
          Home
        </NavLink>
        
        {isAdmin && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}
          >
            Dashboard
          </NavLink>
        )}
        
        <NavLink to="/orders" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}>
          Orders
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}>
          Customers
        </NavLink>
        <NavLink to="/cashier" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}>
          Cashier
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/settings/menus"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}
          >
            Menus
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/settings/categories"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}
          >
            Categories
          </NavLink>
        )}
      </nav>

      <div className="pos-topactions">
        <button className="pos-neworder-btn" onClick={goNewOrder}>
          New Order
        </button>

        <button className="pos-icon-btn" type="button" title="Notifications">
          🔔
        </button>

        <div ref={userMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="pos-icon-btn"
            onClick={() => setOpenUser((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 999,
            }}
            title={`${user.username} (${user.role})`}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              {String(user.username || "A")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div style={{ fontSize: 14, color: "#6C727F", fontWeight: 900 }}>▾</div>
          </button>

          {openUser && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: 220,
                background: "#fff",
                border: "1px solid var(--border-color)",
                borderRadius: 14,
                boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                overflow: "hidden",
                zIndex: 2000,
              }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{user.username}</div>
                <div style={{ fontSize: 12, color: "#9EA3AE" }}>{user.role}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  border: 0,
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "var(--primary-orange)",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}