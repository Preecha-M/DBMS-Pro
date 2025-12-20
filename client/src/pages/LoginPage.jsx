import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(form.username.trim(), form.password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side">
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/login-page-4437043-3684811.png"
          alt="Login"
        />
      </div>

      <div className="auth-form-side">
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">กรุณาเข้าสู่ระบบเพื่อใช้งานระบบ POS</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          <button type="submit" className="btn-auth-primary">
            Sign in
          </button>
        </form>

        <p className="auth-footer">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="auth-link">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
