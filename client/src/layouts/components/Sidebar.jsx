import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../db/api';
import { useAuth } from '../../auth/useAuth';

export default function Sidebar() {
  const { user } = useAuth()
  
  const navigate = useNavigate()
  const location = useLocation()
  
  const [cats, setCats] = useState([])
  
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
  
  if (!user) return null;
  
  return (
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
  )
}