import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./PromotionsPage.css";

// Block minus, e/E, + in numeric inputs
const blockInvalidNumKey = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

export default function PromotionsPage() {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState({
    promotion_name: "",
    promotion_detail: "",
    start_date: "",
    end_date: "",
    discount_type: "AMOUNT",
    discount_value: "",
    min_quantity: "1",
    menu_ids: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setError("");
    setLoading(true);
    try {
      const [promoRes, menuRes] = await Promise.all([
        api.get("/promotions/all"),
        api.get("/menu")
      ]);
      setPromotions(Array.isArray(promoRes.data) ? promoRes.data : []);
      setMenus(Array.isArray(menuRes.data?.data || menuRes.data) ? (menuRes.data?.data || menuRes.data) : []);
    } catch (e) {
      setError(e?.response?.data?.message || t('promotions.errLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      promotion_name: "",
      promotion_detail: "",
      start_date: "",
      end_date: "",
      discount_type: "AMOUNT",
      discount_value: "",
      min_quantity: "1",
      menu_ids: [],
    });
    setEditingId(null);
    setError("");
    setShowModal(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        discount_value: Number(form.discount_value) || 0,
        min_quantity: Number(form.min_quantity) || 1,
      };

      if (editingId) await api.put(`/promotions/${editingId}`, payload);
      else await api.post("/promotions", payload);

      await loadData();
      resetForm();
    } catch (e2) {
      setError(e2?.response?.data?.message || t('promotions.errSaveFailed'));
    }
  };

  const onEdit = (p) => {
    setEditingId(p.promotion_id);
    const formatDate = (ds) => ds ? new Date(ds).toISOString().split('T')[0] : "";
    setForm({
      promotion_name: p.promotion_name || "",
      promotion_detail: p.promotion_detail || "",
      start_date: formatDate(p.start_date),
      end_date: formatDate(p.end_date),
      discount_type: p.discount_type || "AMOUNT",
      discount_value: p.discount_value || "",
      min_quantity: p.min_quantity || "1",
      menu_ids: Array.isArray(p.menu_ids) ? p.menu_ids.map(Number) : [],
    });
    setShowModal(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm(t('promotions.confirmDelete'))) return;
    setError("");
    try {
      await api.delete(`/promotions/${id}`);
      await loadData();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || t('promotions.errDeleteFailed'));
    }
  };

  const toggleMenuCheck = (menuId) => {
    setForm(prev => {
      const current = new Set(prev.menu_ids);
      if (current.has(menuId)) current.delete(menuId);
      else current.add(menuId);
      return { ...prev, menu_ids: Array.from(current) };
    });
  };

  const getStatus = (start, end) => {
    const bkkTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const y = bkkTime.getFullYear();
    const m = String(bkkTime.getMonth() + 1).padStart(2, '0');
    const d = String(bkkTime.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;

    const startDate = start ? start.split('T')[0] : null;
    const endDate = end ? end.split('T')[0] : null;

    if (endDate && today > endDate) return { label: "EXPIRED", class: "expired" };
    if (startDate && today < startDate) return { label: "FUTURE", class: "future" };
    return { label: "ACTIVE", class: "active" };
  };

  return (
    <div className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('promotions.pageTitle')}</h2>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + {t('promotions.titleAdd')}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-card wide">
              <button className="modal-x" type="button" onClick={resetForm}>×</button>
              <h3 className="modal-title" style={{ marginTop: 0, marginBottom: 16 }}>
                {editingId ? t('promotions.titleEdit') : t('promotions.titleAdd')}
              </h3>
              <form onSubmit={onSubmit} className="promo-form-panel">

          <div className="input-group">
            <label>{t('promotions.labelPromoName')}</label>
            <input
              value={form.promotion_name}
              onChange={(e) => setForm((p) => ({ ...p, promotion_name: e.target.value }))}
              placeholder={t('promotions.placeholderPromoName')}
              required
            />
          </div>

          <div className="input-group">
            <label>{t('promotions.labelDetail')}</label>
            <textarea
              value={form.promotion_detail}
              onChange={(e) => setForm((p) => ({ ...p, promotion_detail: e.target.value }))}
              rows={3}
              style={{
                width: "100%", padding: "12px", border: "1px solid var(--border-color)",
                borderRadius: "8px", fontSize: "14px", fontFamily: "inherit"
              }}
              placeholder={t('promotions.placeholderDetail')}
            />
          </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div className="input-group">
              <label>{t('promotions.labelStartDate')}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>{t('promotions.labelEndDate')}</label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <div className="input-group">
              <label>{t('promotions.labelDiscountType')}</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
              >
                <option value="AMOUNT">{t('promotions.optAmount')}</option>
                <option value="PERCENTAGE">{t('promotions.optPercent')}</option>
                <option value="POINTS">{t('promotions.optPoints')}</option>
              </select>
            </div>
            <div className="input-group">
              <label>{t('promotions.labelDiscountVal')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  const max = form.discount_type === "PERCENTAGE" ? 100 : Infinity;
                  setForm((p) => ({ ...p, discount_value: isNaN(v) ? "" : String(Math.min(max, Math.max(0, v))) }));
                }}
                onKeyDown={blockInvalidNumKey}
                placeholder={form.discount_type === "PERCENTAGE" ? t('promotions.placeholderDiscountPercent') : form.discount_type === "POINTS" ? t('promotions.placeholderPointsCost') : t('promotions.placeholderDiscountAmount')}
                required
              />
            </div>
            <div className="input-group">
              <label>{t('promotions.labelMinQty')}</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.min_quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setForm((p) => ({ ...p, min_quantity: isNaN(v) ? "1" : String(Math.max(1, v)) }));
                }}
                onKeyDown={blockInvalidNumKey}
                placeholder={t('promotions.placeholderMinQty')}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: 12 }}>
            <label>เมนูที่เข้าร่วมโปรโมชั่น (ไม่บังคับ)</label>
            <div className="menu-checklist">
              {menus.map(m => (
                <label key={m.menu_id} className="menu-check-item">
                  <input
                    type="checkbox"
                    checked={form.menu_ids.includes(m.menu_id)}
                    onChange={() => toggleMenuCheck(m.menu_id)}
                  />
                  {m.menu_name} (฿{m.price})
                </label>
              ))}
              {menus.length === 0 && <div style={{ fontSize: 13, color: '#999' }}>{t('promotions.noMenuData')}</div>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-soft" onClick={resetForm}>{t('promotions.btnClear') || 'Cancel'}</button>
            <button type="submit" className="btn-primary">
              {editingId ? t('promotions.btnUpdate') : t('promotions.btnCreate')}
            </button>
          </div>
        </form>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>{t('promotions.titleAllPromos')}</div>

          {loading ? (
            <div>{t('promotions.textLoading')}</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {promotions.map((p) => {
                const status = getStatus(p.start_date, p.end_date);
                return (
                  <div key={p.promotion_id} className="promo-row">
                    <div className="promo-left">
                      <div className="promo-name">{p.promotion_name}</div>
                      {p.promotion_detail && <div className="promo-sub">{p.promotion_detail}</div>}
                      
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className={`promo-status ${status.class}`}>{status.label}</div>
                        <div className="promo-dates">
                          {p.start_date ? new Date(p.start_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}
                          {t('promotions.textTo')}
                          {p.end_date ? new Date(p.end_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}
                        </div>
                      </div>
                      
                      {Array.isArray(p.menu_ids) && p.menu_ids.length > 0 && (
                        <div className="promo-sub" style={{ marginTop: 4 }}>
                          {t('promotions.textMenusJoined', { count: p.menu_ids.length })}
                        </div>
                      )}
                      
                      <div className="promo-sub" style={{ marginTop: 4, color: 'var(--primary-orange)', fontWeight: 600 }}>
                        {p.discount_type === 'POINTS'
                          ? `${t('promotions.optPoints')}: ${Number(p.discount_value)} ${t('members.colPoints')} (${t('promotions.textDiscount', { val: Number(p.discount_value), unit: '฿', min: p.min_quantity })})`
                          : t('promotions.textDiscount', { val: Number(p.discount_value), unit: p.discount_type === 'PERCENTAGE' ? '%' : '฿', min: p.min_quantity })}
                      </div>
                    </div>
                    <div className="promo-actions">
                      <button className="qty-btn" type="button" onClick={() => onEdit(p)}>{t('promotions.btnEdit')}</button>
                      <button className="qty-btn" type="button" onClick={() => onDelete(p.promotion_id)}>{t('promotions.btnDelete')}</button>
                    </div>
                  </div>
                );
              })}
              {promotions.length === 0 && <div style={{ color: "#9EA3AE" }}>{t('promotions.noPromos')}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
