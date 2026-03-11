import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../db/api";
import PrintModal from "../components/print/PrintModal";
import PurchaseOrderDocument from "../components/print/PurchaseOrderDocument";
import { blockInvalidNumKey, sanitizeNumberInput } from "../utils/bahtToText";

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    supplier_id: "",
    credit_days: "",
    payment_terms: "",
    payment_method: "",
    notes: "",
  });

  const [items, setItems] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null); // สำหรับ print หลังบันทึก
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    api.get("/suppliers").then(res => setSuppliers(res.data)).catch(console.error);
    api.get("/ingredients").then(res => setIngredients(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addItem = () => setItems([...items, { ingredient_id: "", quantity: 1, unit_cost: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // คำนวณยอด
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0);
  const tax_rate = 7.00;
  const tax_amount = (subtotal * tax_rate) / 100;
  const total_amount = subtotal + tax_amount;

  const getIngredient = (id) => ingredients.find(i => i.ingredient_id === id || String(i.ingredient_id) === String(id));
  const getSupplier = (id) => suppliers.find(s => String(s.supplier_id) === String(id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
    setSubmitting(true);

    try {
      let document_url = null;
      if (documentFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", documentFile);
        const uploadRes = await api.post("/upload/po-document", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        document_url = uploadRes.data.url;
      }

      const res = await api.post("/orders", {
        ...formData,
        supplier_id: Number(formData.supplier_id) || null,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        document_url,
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      });

      // สร้าง order object สำหรับ print (เสริมข้อมูลที่แสดงใน document)
      const supplier = getSupplier(formData.supplier_id);
      const orderForPrint = {
        ...(res.data || {}),
        po_number: res.data?.po_number,
        order_date: formData.order_date,
        delivery_date: formData.delivery_date,
        supplier_name: supplier?.supplier_name,
        payment_terms: formData.payment_terms,
        payment_method: formData.payment_method,
        credit_days: formData.credit_days,
        notes: formData.notes,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        items: items.map(it => {
          const ing = getIngredient(it.ingredient_id);
          return {
            ingredient_id: it.ingredient_id,
            ingredient_name: ing?.ingredient_name || it.ingredient_id,
            unit: ing?.unit || '',
            quantity: Number(it.quantity),
            unit_cost: Number(it.unit_cost),
          };
        }),
      };
      setSavedOrder(orderForPrint);
      setShowPrint(true);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ");
    } finally {
      setSubmitting(false);
    }
  };

  // ======= หน้า Success + Print =======
  if (savedOrder) {
    return (
      <div className="page-pad" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#15803d' }}>บันทึกใบสั่งซื้อสำเร็จ</h2>
          <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
            เลขที่: <strong>{savedOrder.po_number || '-'}</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => setShowPrint(true)}
              style={{ padding: "10px 24px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: 'inherit', fontSize: 15, fontWeight: 600 }}
            >
              🖨 พิมพ์ใบสั่งซื้อ
            </button>
            <button
              onClick={() => navigate("/purchase-orders")}
              style={{ padding: "10px 24px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontFamily: 'inherit', fontSize: 15 }}
            >
              กลับรายการ PO
            </button>
          </div>
        </div>

        {showPrint && (
          <PrintModal
            title={`ใบสั่งซื้อ — ${savedOrder.po_number || ''}`}
            onClose={() => setShowPrint(false)}
          >
            <PurchaseOrderDocument order={savedOrder} />
          </PrintModal>
        )}
      </div>
    );
  }

  // ======= FORM =======
  return (
    <div className="page-pad" style={{ maxWidth: 960, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/purchase-orders")}
        style={{ marginBottom: 20, background: "none", border: "none", color: "#1976d2", cursor: "pointer", fontSize: 15, padding: 0, fontFamily: 'inherit' }}
      >
        ← กลับรายการ PO
      </button>

      <div className="card" style={{ padding: 36 }}>
        {/* ======= Header ======= */}
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "2px solid #333", paddingBottom: 18 }}>
          <h1 style={{ fontSize: 26, margin: "0 0 8px 0" }}>ใบสั่งซื้อ</h1>
          <h2 style={{ fontSize: 16, margin: 0, color: "#6b7280", fontWeight: 400, letterSpacing: 1 }}>PURCHASE ORDER</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ======= Info Grid ======= */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* ซ้าย: ซัพพลายเออร์ + เงื่อนไข */}
            <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>ผู้ขาย (Supplier) *</label>
                <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} required
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }}>
                  <option value="">-- เลือกผู้ขาย --</option>
                  {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>เงื่อนไขการชำระ</label>
                <input type="text" name="payment_terms" value={formData.payment_terms} onChange={handleChange}
                  placeholder="เช่น ทุกสิ้นเดือน"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>วิธีชำระเงิน</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleChange}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }}>
                    <option value="">-- เลือก --</option>
                    <option value="Cash">เงินสด</option>
                    <option value="Transfer">โอนเงิน</option>
                    <option value="Credit">เครดิต</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>วันเครดิต</label>
                  <input type="number" name="credit_days" min="0" value={formData.credit_days}
                    onChange={(e) => setFormData(p => ({ ...p, credit_days: sanitizeNumberInput(e.target.value, false) }))}
                    onKeyDown={blockInvalidNumKey}
                    placeholder="เช่น 30"
                    className="form-number-input" />
                </div>
              </div>
            </div>

            {/* ขวา: เลขที่ + วันที่ */}
            <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, minWidth: 110 }}>เลขที่เอกสาร:</label>
                <input type="text" disabled value="สร้างอัตโนมัติ"
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f9fafb", color: "#9ca3af", fontSize: 14 }} />
              </div>
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, minWidth: 110 }}>วันที่สั่งซื้อ: *</label>
                <input type="date" name="order_date" value={formData.order_date} onChange={handleChange} required
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, minWidth: 110 }}>วันกำหนดส่ง:</label>
                <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange}
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }} />
              </div>
            </div>
          </div>

          {/* ======= Items Table ======= */}
          <div style={{ marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "5%", textAlign: 'center' }}>#</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", textAlign: 'left' }}>รายการ (Description)</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "8%", textAlign: 'center' }}>หน่วย</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "12%", textAlign: 'center' }}>จำนวน</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "16%", textAlign: 'center' }}>ราคา/หน่วย (บาท)</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "16%", textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: "10px 8px", width: "6%", textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const ing = getIngredient(item.ingredient_id);
                  return (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #e5e7eb", padding: "8px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>
                        <select value={item.ingredient_id} onChange={(e) => updateItem(idx, "ingredient_id", e.target.value)} required
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontFamily: 'inherit', fontSize: 14 }}>
                          <option value="">- เลือกสินค้า -</option>
                          {ingredients.map(ing => <option key={ing.ingredient_id} value={ing.ingredient_id}>{ing.ingredient_name}</option>)}
                        </select>
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "8px", textAlign: "center", color: '#6b7280', fontSize: 13 }}>
                        {ing?.unit || '-'}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", sanitizeNumberInput(e.target.value, false))} required
                          onKeyDown={blockInvalidNumKey}
                          className="form-number-input" style={{ textAlign: "right" }} />
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>
                        <input type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(idx, "unit_cost", sanitizeNumberInput(e.target.value, true))} required
                          onKeyDown={blockInvalidNumKey}
                          className="form-number-input" style={{ textAlign: "right" }} />
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "8px", textAlign: "right", background: "#f9fafb", fontWeight: 600 }}>
                        {(Number(item.quantity) * Number(item.unit_cost)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: "8px", textAlign: "center" }}>
                        <button type="button" onClick={() => removeItem(idx)}
                          style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>×</button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                      ยังไม่มีรายการ — กดปุ่มด้านล่างเพื่อเพิ่มรายการสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button type="button" onClick={addItem}
              style={{ padding: "8px 18px", marginTop: 10, background: "#e5e7eb", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontFamily: 'inherit', fontSize: 14 }}>
              + เพิ่มรายการ
            </button>
          </div>

          {/* ======= Totals + Notes ======= */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>หมายเหตุ</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4"
                style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: 6, resize: "vertical", fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>อัปโหลดเอกสารอ้างอิง (ใบเสนอราคา / รูปถ่าย)</label>
                <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  className="form-file-input" />
              </div>
            </div>

            <div style={{ width: 280, border: "1px solid #e5e7eb", borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' }}>
              <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
                <span>รวมเงิน:</span>
                <span>{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
                <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                <span>{tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", background: "#f0fdf4", fontWeight: 700, fontSize: 16 }}>
                <span>จำนวนเงินทั้งสิ้น:</span>
                <span style={{ color: '#15803d' }}>{total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
            </div>
          </div>

          {/* ======= Submit ======= */}
          <div style={{ textAlign: "right" }}>
            <button type="submit" disabled={submitting}
              style={{ padding: "12px 32px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", fontFamily: 'inherit', fontWeight: 600 }}>
              {submitting ? "กำลังบันทึก..." : "บันทึกใบสั่งซื้อ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
