import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import api from "../api/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.username.trim(), form.password);

      // เช็ค role หลัง login (cookie ถูก set แล้ว)
      const me = await api.get("/api/auth/me");
      const role = me.data.user?.role;

      if (role === "Admin" || role === "Manager" || role === "Owner") {
        navigate("/employees/new", { replace: true });
      } else {
        navigate("/menu", { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed";
      setError(msg);
    }
  };

  return (
    <div style={styles.center}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Login</h2>

        <label style={styles.label}>Username</label>
        <input
          name="username"
          value={form.username}
          onChange={onChange}
          style={styles.input}
          autoComplete="username"
          placeholder="admin"
        />

        <label style={styles.label}>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          style={styles.input}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.button} type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}

const styles = {
  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 12,
    background: "#fff",
  },
  label: { display: "block", marginTop: 10, marginBottom: 6, fontSize: 14 },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
  },
  button: {
    marginTop: 14,
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
  },
  error: { marginTop: 10, color: "crimson", fontSize: 14 },
};
