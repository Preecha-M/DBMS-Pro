import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../db/api';
import { useAuth } from '../../auth/useAuth';
import { Coffee, CupSoda, Croissant, CakeSlice, Utensils, Hash } from "lucide-react";

// Helper to render lucide icon based on text input
const renderCategoryIcon = (iconName, size = 18) => {
  const name = String(iconName || "").toLowerCase();
  if (name.includes("coffee") || name.includes("กาแฟ") || name.includes("☕")) return <Coffee size={size} />;
  if (name.includes("no") || name.includes("tea") || name.includes("ชา") || name.includes("🍵") || name.includes("soda") || name.includes("โซดา") || name.includes("drink") || name.includes("เครื่องดื่ม")) return <CupSoda size={size} />;
  if (name.includes("bakery") || name.includes("เบเกอรี่") || name.includes("🥐")) return <Croissant size={size} />;
  if (name.includes("cake") || name.includes("เค้ก") || name.includes("🍰") || name.includes("dessert") || name.includes("ของหวาน")) return <CakeSlice size={size} />;
  if (name.includes("food") || name.includes("อาหาร") || name.includes("🍝")) return <Utensils size={size} />;
  return <Hash size={size} />;
};

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
          className={`sidebar-item ${Number(c.category_id) === activeCatId ? 'active' : ''}`}
          type="button"
          onClick={() => navigate(`/new-order?cat=${c.category_id}`)}
        >
          <div className="sidebar-icon-box" style={{ background: 'transparent' }}>
            {renderCategoryIcon(c.icon || c.category_name, 18)}
          </div>
          <div className="sidebar-label">{c.category_name}</div>
        </button>
      ))}
    </aside>
  )
}