import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";

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

      await load();
      resetForm();

      window.dispatchEvent(new Event("cats:updated"));
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
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await api.delete(`/categories/${id}`);
      await load();
      if (editingId === id) resetForm();

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('categories.pageTitle')}</h2>
        <button className="pos-logout-btn" onClick={resetForm}>{t('categories.btnClear')}</button>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 18, marginTop: 16 }}>
        <form onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>
            {editingId ? t('categories.formTitleEdit') : t('categories.formTitleAdd')}
          </div>

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

          <button type="submit" className="pos-neworder-btn" style={{ marginTop: 14, width: "100%" }}>
            {editingId ? t('categories.btnUpdate') : t('categories.btnCreate')}
          </button>
        </form>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>{t('categories.listTitle')}</div>

          {loading ? (
            <div>{t('categories.textLoading')}</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sorted.map((c) => (
                <div key={c.category_id} className="cat-row">
                  <div className="cat-left">
                    <div className="cat-icon">{c.icon || "•"}</div>
                    <div>
                      <div className="cat-name">{c.category_name}</div>
                      <div className="cat-sub">id: {c.category_id} · pos: {c.position ?? "-"}</div>
                    </div>
                  </div>
                  <div className="cat-actions">
                    <button className="qty-btn" type="button" onClick={() => onEdit(c)}>{t('categories.btnEdit')}</button>
                    <button className="qty-btn" type="button" onClick={() => onDelete(c.category_id)}>{t('categories.btnDelete')}</button>
                  </div>
                </div>
              ))}
              {sorted.length === 0 && <div style={{ color: "#9EA3AE" }}>{t('categories.noCategories')}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
