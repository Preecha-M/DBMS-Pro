import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../db/api";
import { Bell, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth()
  
  const navigate = useNavigate()
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  
  const [openUser, setOpenUser] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  
  const isAdmin = ["admin", "manager"].includes(String(user?.role || "").toLowerCase());
  
  useEffect(() => {
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setOpenUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.get("/ingredients/low-stock?threshold=5")
        .then(res => setLowStockItems(res.data))
        .catch(err => console.error("Failed to load low stock alerts", err));
    }
  }, [isAdmin]);
  
  const onLogout = async () => {
    setOpenUser(false);
    await logout();
    navigate("/login", { replace: true });
  };
  
  const goNewOrder = () => navigate("/new-order");
  
  if (!user) return null;

  return (
    <header className="pos-topbar">
      <div className="pos-topbar-left">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setOpenMenu(!openMenu)}
        >
          {openMenu ? <X size={24} color="#19191C" /> : <Menu size={24} color="#19191C" />}
        </button>

        <div className="pos-brand" onClick={() => navigate("/home")}>
          CP <span>POS</span>
        </div>
      </div>

      <nav className={`pos-topnav ${openMenu ? 'mobile-open' : ''}`}>
        <NavLink to="/home" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          Home
        </NavLink>
        <NavLink to="/sales-history" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          Sales History
        </NavLink>
        <NavLink to="/Members" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          Members
        </NavLink>
        <NavLink to="/cashier" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          Cashier
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/settings/menus"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}
          >
            Menus
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/settings/categories"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}
          >
            Categories
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/settings/options"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}
          >
            Options
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/inventory"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}
          >
            Inventory
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/settings/promotions"
            className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}
          >
            Promotions
          </NavLink>
        )}
      </nav>


      <div className="pos-topactions">
        <button className="pos-neworder-btn" onClick={goNewOrder}>
          New Order
        </button>

        {isAdmin && (
          <div ref={notifRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button 
              className="pos-icon-btn" 
              type="button" 
              title="Notifications"
              onClick={() => setOpenNotif(!openNotif)}
              style={{ position: 'relative' }}
            >
              <Bell size={20} color="#19191C" />
              {lowStockItems.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 10,
                  height: 10,
                  background: 'var(--primary-red, #E63946)',
                  borderRadius: '50%',
                  border: '2px solid #fff'
                }}></span>
              )}
            </button>
            {openNotif && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  width: 280,
                  background: "#fff",
                  border: "1px solid var(--border-color)",
                  borderRadius: 14,
                  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                  overflow: "hidden",
                  zIndex: 2000,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: "1px solid var(--border-color)", fontWeight: 900, background: '#f9fafb' }}>
                  การแจ้งเตือนสต็อก <span style={{ color: 'var(--primary-red, #E63946)' }}>({lowStockItems.length})</span>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {lowStockItems.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#9EA3AE', fontSize: 13 }}>
                      ไม่มีการแจ้งเตือนสินค้าใกล้หมด
                    </div>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.ingredient_id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f5' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#19191C' }}>{item.ingredient_name || item.ingredient_id}</div>
                        <div style={{ fontSize: 13, color: 'var(--primary-red, #E63946)', marginTop: 4 }}>
                          คงเหลือ: {item.quantity_on_hand} {item.unit || 'หน่วย'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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