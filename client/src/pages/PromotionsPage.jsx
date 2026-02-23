import { useEffect, useState, useMemo } from "react";
import api from "../db/api";
import "./PromotionsPage.css";

export default function PromotionsPage() {
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
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
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
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (editingId) await api.put(`/promotions/${editingId}`, payload);
      else await api.post("/promotions", payload);

      await loadData();
      resetForm();
    } catch (e2) {
      setError(e2?.response?.data?.message || "บันทึกไม่สำเร็จ");
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
  };

  const onDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบโปรโมชั่นนี้?")) return;
    setError("");
    try {
      await api.delete(`/promotions/${id}`);
      await loadData();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "ลบไม่สำเร็จ");
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
    const today = new Date().toISOString().split('T')[0];
    const startDate = start ? new Date(start).toISOString().split('T')[0] : null;
    const endDate = end ? new Date(end).toISOString().split('T')[0] : null;

    if (endDate && today > endDate) return { label: "EXPIRED", class: "expired" };
    if (startDate && today < startDate) return { label: "FUTURE", class: "future" };
    return { label: "ACTIVE", class: "active" };
  };

  return (
    <div className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>จัดการโปรโมชั่น</h2>
        <button className="pos-logout-btn" onClick={resetForm}>Clear Form</button>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="promo-page-grid">
        <form onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>
            {editingId ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่"}
          </div>

          <div className="input-group">
            <label>ชื่อโปรโมชั่น</label>
            <input
              value={form.promotion_name}
              onChange={(e) => setForm((p) => ({ ...p, promotion_name: e.target.value }))}
              placeholder="เช่น Buy 1 Get 1"
              required
            />
          </div>

          <div className="input-group">
            <label>รายละเอียด</label>
            <textarea
              value={form.promotion_detail}
              onChange={(e) => setForm((p) => ({ ...p, promotion_detail: e.target.value }))}
              rows={3}
              style={{
                width: "100%", padding: "12px", border: "1px solid var(--border-color)",
                borderRadius: "8px", fontSize: "14px", fontFamily: "inherit"
              }}
              placeholder="เงื่อนไขย่อๆ"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div className="input-group">
              <label>วันที่เริ่ม</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>วันที่สิ้นสุด</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <div className="input-group">
              <label>รูปแบบส่วนลด</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
              >
                <option value="AMOUNT">หักเป็นเงิน (฿)</option>
                <option value="PERCENTAGE">หักเปอร์เซ็นต์ (%)</option>
              </select>
            </div>
            <div className="input-group">
              <label>มูลค่าส่วนลด</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                placeholder={form.discount_type === "PERCENTAGE" ? "เช่น 10 ซึงคือ 10%" : "เช่น 15 บาท"}
                required
              />
            </div>
            <div className="input-group">
              <label>จำนวนขั้นต่ำที่ต้องซื้อ</label>
              <input
                type="number"
                min="1"
                value={form.min_quantity}
                onChange={(e) => setForm((p) => ({ ...p, min_quantity: e.target.value }))}
                placeholder="เช่น 1, 2"
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
              {menus.length === 0 && <div style={{ fontSize: 13, color: '#999' }}>ไม่มีข้อมูลเมนู</div>}
            </div>
          </div>

          <button type="submit" className="pos-neworder-btn" style={{ marginTop: 14, width: "100%" }}>
            {editingId ? "Update" : "Create"}
          </button>
        </form>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>รายการโปรโมชั่นทั้งหมด</div>

          {loading ? (
            <div>Loading...</div>
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
                          {p.start_date ? new Date(p.start_date).toLocaleDateString('th-TH') : "-"}
                          {" ถึง "}
                          {p.end_date ? new Date(p.end_date).toLocaleDateString('th-TH') : "-"}
                        </div>
                      </div>
                      
                      {Array.isArray(p.menu_ids) && p.menu_ids.length > 0 && (
                        <div className="promo-sub" style={{ marginTop: 4 }}>
                          เมนูที่ร่วม: {p.menu_ids.length} เมนู
                        </div>
                      )}
                      
                      <div className="promo-sub" style={{ marginTop: 4, color: 'var(--primary-orange)', fontWeight: 600 }}>
                        ลด: {Number(p.discount_value)} {p.discount_type === 'PERCENTAGE' ? '%' : '฿'} 
                        {' | '} ซื้อขั้นต่ำ: {p.min_quantity} แก้ว
                      </div>
                    </div>
                    <div className="promo-actions">
                      <button className="qty-btn" type="button" onClick={() => onEdit(p)}>Edit</button>
                      <button className="qty-btn" type="button" onClick={() => onDelete(p.promotion_id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
              {promotions.length === 0 && <div style={{ color: "#9EA3AE" }}>ยังไม่มีโปรโมชั่น</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
