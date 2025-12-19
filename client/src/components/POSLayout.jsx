import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

export default function POSLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);

  const loadCats = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const list = Array.isArray(res.data) ? res.data : [];

      list.sort(
        (a, b) =>
          Number(a.position ?? 999) - Number(b.position ?? 999) ||
          Number(a.category_id) - Number(b.category_id)
      );

      setCats(list);
    } catch (e) {
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

  if (!user) return null;

  const isAdmin = ["Admin", "Manager"].includes(user.role);

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <header className="pos-topbar">
        <div className="pos-brand" onClick={() => navigate("/home")}>
          CP <span>POS</span>
        </div>

        <nav className="pos-topnav">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `pos-toplink ${isActive ? "active" : ""}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `pos-toplink ${isActive ? "active" : ""}`
            }
          >
            Orders
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `pos-toplink ${isActive ? "active" : ""}`
            }
          >
            Customers
          </NavLink>
          <NavLink
            to="/cashier"
            className={({ isActive }) =>
              `pos-toplink ${isActive ? "active" : ""}`
            }
          >
            Cashier
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/settings/menus"
              className={({ isActive }) =>
                `pos-toplink ${isActive ? "active" : ""}`
              }
            >
              Menus
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/settings/categories"
              className={({ isActive }) =>
                `pos-toplink ${isActive ? "active" : ""}`
              }
            >
              Categories
            </NavLink>
          )}
        </nav>

        <div className="pos-topactions">
          <button
            className="pos-neworder-btn"
            onClick={() => navigate("/new-order")}
          >
            New Order
          </button>
          <button className="pos-icon-btn" type="button" title="Notifications">
            🔔
          </button>

          <div
            className="pos-user-chip"
            title={`${user.username} (${user.role})`}
          >
            <div className="pos-avatar">
              {String(user.username || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="pos-user-meta">
              <div className="pos-user-name">{user.username}</div>
              <div className="pos-user-role">{user.role}</div>
            </div>
          </div>

          <button className="pos-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="main-wrapper">
        <aside className="sidebar-nav">
          {cats.map((c) => (
            <button
              key={c.category_id}
              className="sidebar-item"
              type="button"
              onClick={() => navigate(`/new-order?cat=${c.category_id}`)}
            >
              <div className="sidebar-icon-box">{c.icon || "•"}</div>
              <div>{c.category_name}</div>
            </button>
          ))}

          {cats.length === 0 && (
            <div style={{ padding: 12, color: "#9EA3AE" }}>No categories</div>
          )}
        </aside>

        <main className="pos-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
