import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import { Coffee, CupSoda, Croissant, CakeSlice, ShoppingBag, Utensils, Hash } from "lucide-react";

// Helper to render lucide icon based on text input
const renderCategoryIcon = (iconName, size = 32) => {
  const name = String(iconName || "").toLowerCase();
  if (name.includes("coffee") || name.includes("กาแฟ") || name.includes("☕")) return <Coffee size={size} />;
  if (name.includes("no") || name.includes("tea") || name.includes("ชา") || name.includes("🍵") || name.includes("soda") || name.includes("โซดา") || name.includes("drink") || name.includes("เครื่องดื่ม")) return <CupSoda size={size} />;
  if (name.includes("bakery") || name.includes("เบเกอรี่") || name.includes("🥐")) return <Croissant size={size} />;
  if (name.includes("cake") || name.includes("เค้ก") || name.includes("🍰") || name.includes("dessert") || name.includes("ของหวาน")) return <CakeSlice size={size} />;
  if (name.includes("food") || name.includes("อาหาร") || name.includes("🍝")) return <Utensils size={size} />;
  return <Hash size={size} />;
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    category_name: "",
    icon: "",
    position: 1,
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || t('categories.errLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ category_name: "", icon: "", position: 1, is_active: true });
    setEditingId(null);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    resetForm();
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const name = form.category_name.trim();
      if (!name) return setError(t('categories.errNameEmpty'));

      const payload = {
        category_name: name,
        icon: form.icon || null,
        position: Number(form.position) || 1,
        is_active: !!form.is_active,
      };

      if (editingId) await api.put(`/categories/${editingId}`, payload);
      else await api.post("/categories", payload);

      closeFormModal();
      window.location.reload();
    } catch (e2) {
      setError(e2?.response?.data?.message || t('categories.errSaveFailed'));
    }
  };

  const onEdit = (c) => {
    setEditingId(c.category_id);
    setForm({
      category_name: c.category_name || "",
      icon: c.icon || "",
      position: c.position ?? 1,
      is_active: c.is_active ?? true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this category?'))) return;
    setError("");
    try {
      await api.delete(`/categories/${id}`);
      await load();
      window.dispatchEvent(new Event("cats:updated"));
    } catch (e) {
      setError(e?.response?.data?.message || t('categories.errDeleteFailed'));
    }
  };

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        (a.position ?? 999) - (b.position ?? 999) ||
        a.category_id - b.category_id
    );
  }, [items]);

  return (
    <div className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('categories.pageTitle')}</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + {t('categories.formTitleAdd')}
        </button>
      </div>

      {error && !isModalOpen && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div>{t('categories.textLoading')}</div>
      ) : (
        <div className="menu-grid">
          {sorted.map((c) => (
            <div key={c.category_id} className="menu-card">
              <div className="menu-card-header">
                <div 
                  className="menu-card-img" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 32,
                    background: '#fff',
                    color: 'var(--primary-orange)'
                  }}
                >
                  {renderCategoryIcon(c.icon || c.category_name, 36)}
                </div>
                <div className="menu-card-info">
                  <div className="menu-card-title">{c.category_name}</div>
                  <div className="menu-card-meta">
                    {c.is_active ? 'Active' : 'Inactive'} · id: {c.category_id} · pos: {c.position ?? "-"}
                  </div>
                </div>
              </div>

              <div className="menu-card-actions">
                <button
                  className="menu-card-btn"
                  type="button"
                  onClick={() => onEdit(c)}
                >
                  {t('categories.btnEdit')}
                </button>
                <button
                  className="menu-card-btn delete"
                  type="button"
                  onClick={() => onDelete(c.category_id)}
                >
                  {t('categories.btnDelete')}
                </button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div style={{ color: "#9EA3AE", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
              {t('categories.noCategories')}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={closeFormModal}>
              ×
            </button>
            <div className="modal-title" style={{ marginBottom: 16 }}>
              {editingId ? t('categories.formTitleEdit') : t('categories.formTitleAdd')}
            </div>
            
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="input-group">
                <label>{t('categories.labelName')}</label>
                <input
                  value={form.category_name}
                  onChange={(e) => setForm((p) => ({ ...p, category_name: e.target.value }))}
                  placeholder={t('categories.placeholderName')}
                  required
                />
              </div>

              <div className="input-group">
                <label>{t('categories.labelIcon')}</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="เช่น ☕ หรือ coffee"
                />
              </div>

              <div className="input-group">
                <label>{t('categories.labelPosition')}</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                  min="1"
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <div>Active</div>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={closeFormModal}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? t('categories.btnUpdate') : t('categories.btnCreate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
