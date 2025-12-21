import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../db/api";

export default function Registration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name_th: "",
    last_name_th: "",
  });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/employees", { ...form, role: "Staff", status: "Active" });
      alert("ลงทะเบียนพนักงานสำเร็จ");
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "สมัครสมาชิกไม่สำเร็จ");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side">
        <img src="https://cdni.iconscout.com/illustration/premium/thumb/registration-page-4437044-3684812.png" alt="Register" />
      </div>

      <div className="auth-form-side">
        <h2 className="auth-title">Registration</h2>
        <p className="auth-subtitle">สร้างบัญชีผู้ใช้งานใหม่สำหรับพนักงาน</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input 
              name="username" 
              onChange={(e) => setForm({...form, username: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              name="password" 
              type="password" 
              onChange={(e) => setForm({...form, password: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>ชื่อ (ภาษาไทย)</label>
            <input 
              name="first_name_th" 
              onChange={(e) => setForm({...form, first_name_th: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>นามสกุล (ภาษาไทย)</label>
            <input 
              name="last_name_th" 
              onChange={(e) => setForm({...form, last_name_th: e.target.value})} 
            />
          </div>

          <button type="submit" className="btn-auth-primary">Create Account</button>
        </form>

        <p className="auth-footer">
          มีบัญชีอยู่แล้ว? <Link to="/login" className="auth-link">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}