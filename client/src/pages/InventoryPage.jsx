import { useEffect, useState } from "react";
import api from "../db/api";
import "./InventoryPage.css";

export default function InventoryPage() {
  const [tab, setTab] = useState("withdraw"); // withdraw | add | orders
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadIngredients = async () => {
    try {
      const res = await api.get("/ingredients");
      setIngredients(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadOrders();
    loadCategories();
    loadSuppliers();
  }, [tab]);

  // Withdraw State
  const [wdId, setWdId] = useState("");
  const [wdQty, setWdQty] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!wdId || !wdQty) return setError("กรุณาเลือกวัตถุดิบและใส่จำนวน");
    try {
      await api.post(`/ingredients/${wdId}/withdraw`, { quantity: Number(wdQty) });
      setSuccess("เบิกวัตถุดิบสำเร็จ");
      setWdId(""); setWdQty("");
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // Add Ingredient State
  const [addForm, setAddForm] = useState({
    ingredient_id: "", ingredient_name: "", unit: "", cost_per_unit: "", quantity_on_hand: 0, expire_date: "", category_code: ""
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("/ingredients", {
        ...addForm,
        cost_per_unit: Number(addForm.cost_per_unit),
        quantity_on_hand: Number(addForm.quantity_on_hand)
      });
      setSuccess("เพิ่มวัตถุดิบสำเร็จ");
      setAddForm({ ingredient_id: "", ingredient_name: "", unit: "", cost_per_unit: "", quantity_on_hand: 0, expire_date: "", category_code: "" });
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // Update Order State
  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    if (currentStatus.toLowerCase() === 'received') return;
    if (!window.confirm("ยืนยันการรับสินค้า (สถานะจะเปลี่ยนเป็น Received และสต๊อกจะเพิ่มขึ้น)?")) return;
    try {
      await api.put(`/orders/${orderId}/status`, { order_status: "Received" });
      setSuccess("อัพเดทสถานะสำเร็จ");
      loadOrders();
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="page-pad">
      <h2 style={{ marginBottom: 20 }}>จัดการคลังวัตถุดิบ (Inventory)</h2>

      <div className="inventory-tabs">
        <div className={`inv-tab ${tab === "withdraw" ? "active" : ""}`} onClick={() => { setTab("withdraw"); setError(""); setSuccess(""); }}>
          เบิกวัตถุดิบ
        </div>
        <div className={`inv-tab ${tab === "add" ? "active" : ""}`} onClick={() => { setTab("add"); setError(""); setSuccess(""); }}>
          เพิ่มวัตถุดิบใหม่
        </div>
        <div className={`inv-tab ${tab === "orders" ? "active" : ""}`} onClick={() => { setTab("orders"); setError(""); setSuccess(""); }}>
          สั่งซื้อ/สถานะ
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      {tab === "withdraw" && (
        <div className="card inv-form-container" style={{ padding: 24 }}>
          <form onSubmit={handleWithdraw}>
            <div className="input-group">
              <label>เลือกวัตถุดิบ</label>
              <select value={wdId} onChange={e => setWdId(e.target.value)} required>
                <option value="">-- เลือกวัตถุดิบ --</option>
                {ingredients.map(ig => (
                  <option key={ig.ingredient_id} value={ig.ingredient_id}>
                    {ig.ingredient_name} (คงเหลือ: {ig.quantity_on_hand} {ig.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>จำนวนที่เบิก</label>
              <input type="number" min="1" value={wdQty} onChange={e => setWdQty(e.target.value)} required />
            </div>
            <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 12 }}>ยืนยันการเบิก</button>
          </form>
        </div>
      )}

      {tab === "add" && (
        <div className="card inv-form-container" style={{ padding: 24 }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="input-group">
                <label>รหัสวัตถุดิบ (ID)</label>
                <input value={addForm.ingredient_id} onChange={e => setAddForm(p => ({ ...p, ingredient_id: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>ชื่อวัตถุดิบ</label>
                <input value={addForm.ingredient_name} onChange={e => setAddForm(p => ({ ...p, ingredient_name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>หมวดหมู่</label>
                <select value={addForm.category_code} onChange={e => setAddForm(p => ({ ...p, category_code: e.target.value }))}>
                  <option value="">-- ไม่ระบุ --</option>
                  {categories.map(c => <option key={c.category_id || c.category_code} value={c.category_id || c.category_code}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>หน่วย (เช่น kg, liter)</label>
                <input value={addForm.unit} onChange={e => setAddForm(p => ({ ...p, unit: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>ราคาต่อหน่วย</label>
                <input type="number" step="0.01" value={addForm.cost_per_unit} onChange={e => setAddForm(p => ({ ...p, cost_per_unit: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>จำนวนเริ่มต้น (Stock)</label>
                <input type="number" value={addForm.quantity_on_hand} onChange={e => setAddForm(p => ({ ...p, quantity_on_hand: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 20 }}>บันทึกข้อมูล</button>
          </form>
        </div>
      )}

      {tab === "orders" && (
        <div className="card" style={{ padding: 24 }}>
          <table className="inv-table">
            <thead>
              <tr>
                <th>รหัสใบสั่งซื้อ</th>
                <th>วันที่สั่ง</th>
                <th>ซัพพลายเออร์</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{new Date(o.order_date).toLocaleDateString("th-TH")}</td>
                  <td>{o.supplier_name || "-"}</td>
                  <td>
                    <span className={`inv-badge ${String(o.order_status).toLowerCase() === 'received' ? 'received' : 'pending'}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td>
                    {String(o.order_status).toLowerCase() !== 'received' && (
                      <button className="qty-btn" onClick={() => handleUpdateOrderStatus(o.order_id, o.order_status)}>
                        รับสินค้า
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center" }}>ไม่มีข้อมูลการสั่งซื้อ</td></tr>}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
