import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [formData, setFormData] = useState({
    po_number: `PO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(4, "0")}`,
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    supplier_id: "",
    credit_days: "",
    payment_terms: "",
    notes: "",
  });

  const [items, setItems] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch dependencies
    api.get("/suppliers").then(res => setSuppliers(res.data)).catch(console.error);
    api.get("/ingredients").then(res => setIngredients(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addItem = () => {
    setItems([...items, { ingredient_id: "", quantity: 1, unit_cost: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0);
  const tax_rate = 7.00;
  const tax_amount = (subtotal * tax_rate) / 100;
  const total_amount = subtotal + tax_amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Please add at least one item.");
    setSubmitting(true);

    try {
      let document_url = null;
      if (documentFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", documentFile);
        const uploadRes = await api.post("/upload/po-document", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        document_url = uploadRes.data.url;
      }

      await api.post("/orders", {
        ...formData,
        order_status: "Received",
        supplier_id: Number(formData.supplier_id) || null,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        document_url,
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost)
        }))
      });

      alert("Purchase order created successfully!");
      navigate("/purchase-orders");
    } catch (error) {
      console.error(error);
      alert("Error creating purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-pad" style={{ padding: "20px", width: "100%", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/purchase-orders")} style={{ marginBottom: "20px", background: "none", border: "none", color: "#1976d2", cursor: "pointer", fontSize: "16px" }}>
        &larr; Back to List
      </button>

      <div style={{ background: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        {/* Header - Formal Thai Format */}
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #333", paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "28px", margin: "0 0 10px 0" }}>บันทึกบิลรับสินค้าเข้าสต๊อก (ใบสั่งซื้อ)</h1>
          <h2 style={{ fontSize: "20px", margin: "0", color: "#555" }}>GOODS RECEIPT / PURCHASE RECORD</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Document Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "4px" }}>ผู้ขาย (Supplier)</label>
                <select 
                  name="supplier_id" 
                  value={formData.supplier_id} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                  <option value="">-- เลือกผู้ขาย (Select Supplier) --</option>
                  {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "4px" }}>เงื่อนไขการชำระ (Payment Terms)</label>
                <input 
                  type="text" 
                  name="payment_terms" 
                  value={formData.payment_terms} 
                  onChange={handleChange}
                  placeholder="เช่น ทุกเช้าวันจันทร์"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "4px" }}>จำนวนวันเครดิต (Credit Days)</label>
                <input 
                  type="number" 
                  name="credit_days" 
                  value={formData.credit_days} 
                  onChange={handleChange}
                  placeholder="เช่น 30"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
            </div>

            <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
              <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", fontWeight: "bold" }}>เลขที่เอกสาร:</label>
                <input 
                  type="text" 
                  name="po_number" 
                  value={formData.po_number} 
                  onChange={handleChange}
                  required
                  style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", fontWeight: "bold" }}>วันที่เอกสาร:</label>
                <input 
                  type="date" 
                  name="order_date" 
                  value={formData.order_date} 
                  onChange={handleChange}
                  required
                  style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", fontWeight: "bold" }}>วันที่กำหนดส่ง:</label>
                <input 
                  type="date" 
                  name="delivery_date" 
                  value={formData.delivery_date} 
                  onChange={handleChange}
                  style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "30px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "5%" }}>#</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "40%" }}>รายการ (Description)</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "15%" }}>จำนวน (Qty)</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "15%" }}>ราคา/หน่วย (Unit Price)</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "15%" }}>จำนวนเงิน (Amount)</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      <select 
                        value={item.ingredient_id} 
                        onChange={(e) => updateItem(idx, "ingredient_id", e.target.value)}
                        required
                        style={{ width: "100%", padding: "6px", border: "1px solid #ccc" }}
                      >
                        <option value="">- เลือกสินค้า -</option>
                        {ingredients.map(ing => <option key={ing.ingredient_id} value={ing.ingredient_id}>{ing.ingredient_name}</option>)}
                      </select>
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        required
                        style={{ width: "100%", padding: "6px", border: "1px solid #ccc", textAlign: "right" }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={item.unit_cost} 
                        onChange={(e) => updateItem(idx, "unit_cost", e.target.value)}
                        required
                        style={{ width: "100%", padding: "6px", border: "1px solid #ccc", textAlign: "right" }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", background: "#f9f9f9" }}>
                      {(item.quantity * item.unit_cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                      <button type="button" onClick={() => removeItem(idx)} style={{ color: "red", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              type="button" 
              onClick={addItem}
              style={{ padding: "8px 15px", marginTop: "10px", background: "#e0e0e0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
            >
              + เพิ่มรายการ (Add Item)
            </button>
          </div>

          {/* Totals & Notes */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "20px" }}>
            <div style={{ flex: 1, padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>หมายเหตุ (Remarks)</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }}
              />

              <div style={{ marginTop: "15px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>อัปโหลดเอกสารอ้างอิง (Upload Reference Document, e.g., Quote/PO Photo)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  style={{ width: "100%", padding: "8px", border: "1px dashed #ccc", borderRadius: "4px" }}
                />
              </div>
            </div>

            <div style={{ width: "300px", padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span>รวมเงิน (Sub Total):</span>
                <span>{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span>ภาษีมูลค่าเพิ่ม (VAT) 7%:</span>
                <span>{tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "2px solid #333", fontWeight: "bold", fontSize: "18px" }}>
                <span>จำนวนเงินทั้งสิ้น (Grand Total):</span>
                <span>{total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ padding: "12px 30px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "บันทึกกำลังดำเนินการ..." : "บันทึกบิลและรับของเข้าสต๊อก (Save & Receive Stock)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
