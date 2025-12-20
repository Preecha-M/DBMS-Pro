import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/api";

export default function POSLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cats, setCats] = useState([]);
  const [openUser, setOpenUser] = useState(false);
  const userMenuRef = useRef(null);

  const activeCatId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("cat");
    return v ? Number(v) : null;
  }, [location.search]);

  const loadCats = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const list = Array.isArray(res.data) ? res.data : [];
      list.sort(
        (a, b) =>
          Number(a.position ?? 999) - Number(b.position ?? 999) ||
          Number(a.category_id) - Number(b.category_id)
      );
      setCats(list.filter((c) => c.is_active !== false));
    } catch {
      setCats([]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCats();
    const onUpdated = () => loadCats();
    window.addEventListener("cats:updated", onUpdated);
    return () => window.removeEventListener("cats:updated", onUpdated);
  }, [user, loadCats]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  const isAdmin = ["Admin", "Manager"].includes(user.role);

  const onLogout = async () => {
    setOpenUser(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const goNewOrder = () => navigate("/new-order");

  return (
    <div className="app-layout">
      <header className="pos-topbar">
        <div className="pos-brand" onClick={() => navigate("/home")}>
          Easy <span>POS</span>
        </div>

        <nav className="pos-topnav" style={{ flex: 1, justifyContent: "center" }}>
          <NavLink to="/home" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
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

      <div className="main-wrapper">
        <aside className="sidebar-nav">
          {cats.map((c) => (
            <button
              key={c.category_id}
              className={`sidebar-item ${Number(c.category_id) === activeCatId ? "active" : ""}`}
              type="button"
              onClick={() => navigate(`/new-order?cat=${c.category_id}`)}
            >
              <div className="sidebar-icon-box">{c.icon || "•"}</div>
              <div>{c.category_name}</div>
            </button>
          ))}

          <button
            type="button"
            className="sidebar-item"
            style={{ marginTop: "auto", paddingBottom: 18 }}
            onClick={() => navigate("/cashier")}
          >
            <div className="sidebar-icon-box">🧾</div>
            <div>Table</div>
          </button>
        </aside>

        <main className="pos-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
