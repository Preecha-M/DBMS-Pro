import { useState } from "react";
import api from "../db/api";

export default function AddEmployeePage() {
  const [form, setForm] = useState({
    first_name_th: "",
    last_name_th: "",
    phone: "",
    birth_date: "",
    education: "",
    username: "",
    password: "",
    role: "Staff",
    status: "Active",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("กรุณากรอก username และ password");
      return;
    }

    try {
      const payload = {
        ...form,
        username: form.username.trim(),
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        education: form.education || null,
      };

      const res = await api.post("/employees", payload);
      setMsg(`เพิ่มพนักงานสำเร็จ: ${res.data.username} (${res.data.role})`);

      setForm((p) => ({ ...p, username: "", password: "" }));
    } catch (err) {
      const m = err?.response?.data?.message || "เพิ่มพนักงานไม่สำเร็จ";
      setError(m);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h2>เพิ่มพนักงาน</h2>

      <form onSubmit={onSubmit} style={styles.grid}>
        <Field label="ชื่อ (TH)">
          <input name="first_name_th" value={form.first_name_th} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="นามสกุล (TH)">
          <input name="last_name_th" value={form.last_name_th} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="เบอร์โทร">
          <input name="phone" value={form.phone} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="วันเกิด">
          <input name="birth_date" type="date" value={form.birth_date} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="การศึกษา">
          <input name="education" value={form.education} onChange={onChange} style={styles.input} />
        </Field>

        <div />

        <Field label="Username *">
          <input name="username" value={form.username} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="Password *">
          <input name="password" type="password" value={form.password} onChange={onChange} style={styles.input} />
        </Field>

        <Field label="Role">
          <select name="role" value={form.role} onChange={onChange} style={styles.input}>
            <option value="Staff">Staff</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </Field>

        <Field label="Status">
          <select name="status" value={form.status} onChange={onChange} style={styles.input}>
            <option value="Active">Active</option>
            <option value="Resigned">Resigned</option>
          </select>
        </Field>

        {error && <div style={{ gridColumn: "1 / -1", color: "crimson" }}>{error}</div>}
        {msg && <div style={{ gridColumn: "1 / -1", color: "green" }}>{msg}</div>}

        <button type="submit" style={{ ...styles.button, gridColumn: "1 / -1" }}>
          บันทึก
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 14 }}>{label}</div>
      {children}
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" },
  button: { padding: 10, borderRadius: 10, border: "none", cursor: "pointer" },
};
