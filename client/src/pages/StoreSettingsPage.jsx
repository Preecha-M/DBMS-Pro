import { useState } from "react";
import { useStoreConfig } from "../context/StoreConfigContext";

export default function StoreSettingsPage() {
  const { config, setConfig } = useStoreConfig();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfig(form);
    setSaved(true);
  };

  const handleReset = () => {
    if (!confirm("รีเซ็ตข้อมูลร้านทั้งหมดกลับเป็นค่าเริ่มต้น?")) return;
    const defaults = {
      name: 'ชื่อร้านค้า / บริษัท ของคุณ',
      address: 'ที่อยู่ร้าน เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์',
      taxId: '',
      phone: '',
      branch: 'สาขาสำนักงานใหญ่',
    };
    setForm(defaults);
    setConfig(defaults);
    setSaved(true);
  };

  return (
    <div className="page-pad" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 6px 0" }}>ข้อมูลร้านค้า</h2>
      <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: 14 }}>
        ข้อมูลเหล่านี้จะปรากฏในส่วนหัวของ <strong>ใบสั่งซื้อ</strong> และ <strong>ใบเบิกวัตถุดิบ</strong>
      </p>

      {saved && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          ✓ บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <Field
            label="ชื่อร้าน / บริษัท"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="เช่น ร้านอาหาร CP Kitchen"
            required
          />
          <Field
            label="ที่อยู่"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="เช่น 123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
            textarea
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field
              label="เลขประจำตัวผู้เสียภาษี"
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              placeholder="เช่น 0123456789012"
            />
            <Field
              label="เบอร์โทรศัพท์"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="เช่น 02-123-4567"
            />
          </div>

          <Field
            label="สาขา"
            name="branch"
            value={form.branch}
            onChange={handleChange}
            placeholder="เช่น สาขาสำนักงานใหญ่"
          />

          {/* Preview */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 18px", marginTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>ตัวอย่างหัวเอกสาร</div>
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{form.name || '—'}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{form.address || '—'}</div>
              {(form.taxId || form.phone) && (
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                  {form.taxId && `เลขประจำตัวผู้เสียภาษี: ${form.taxId}`}
                  {form.taxId && form.phone && ' | '}
                  {form.phone && `โทร: ${form.phone}`}
                  {` | ${form.branch}`}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>ใบสั่งซื้อ / ใบเบิกวัตถุดิบ</div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{ padding: "9px 18px", background: "none", border: "1px solid #e5e7eb", color: "#6b7280", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
            >
              รีเซ็ตค่าเริ่มต้น
            </button>
            <button
              type="submit"
              style={{ padding: "10px 28px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, required, textarea }) {
  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
    resize: textarea ? "vertical" : undefined,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={2}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
        />
      )}
    </div>
  );
}
