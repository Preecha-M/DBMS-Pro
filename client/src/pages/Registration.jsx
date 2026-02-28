import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../db/api";

export default function Registration() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name_th: "",
    last_name_th: "",
    first_name_en: "",
    last_name_en: "",
    phone: "",
    birth_date: "",
    education: "",
    role: "Staff"
  });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        username: form.username.trim(),
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        education: form.education || null,
        role: form.role,
        status: "Active"
      };
      await api.post("/employees", payload);
      alert(t('registration.alertSuccess'));
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || t('registration.errRegFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side">
        <img src="https://cdni.iconscout.com/illustration/premium/thumb/registration-page-4437044-3684812.png" alt="Register" />
      </div>

      <div className="auth-form-side">
        <h2 className="auth-title">{t('registration.titleRegistration')}</h2>
        <p className="auth-subtitle">{t('registration.subtitleReg')}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label>{t('registration.labelUsername')}</label>
            <input 
              name="username" 
              onChange={(e) => setForm({...form, username: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>{t('registration.labelPassword')}</label>
            <input 
              name="password" 
              type="password" 
              onChange={(e) => setForm({...form, password: e.target.value})} 
              required 
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label>{t('registration.labelFirstNameTh')}</label>
              <input 
                name="first_name_th" 
                onChange={(e) => setForm({...form, first_name_th: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label>{t('registration.labelLastNameTh')}</label>
              <input 
                name="last_name_th" 
                onChange={(e) => setForm({...form, last_name_th: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label>{t('registration.labelFirstNameEn')}</label>
              <input 
                name="first_name_en" 
                onChange={(e) => setForm({...form, first_name_en: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label>{t('registration.labelLastNameEn')}</label>
              <input 
                name="last_name_en" 
                onChange={(e) => setForm({...form, last_name_en: e.target.value})} 
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('registration.labelPhone')}</label>
            <input 
              name="phone" 
              onChange={(e) => setForm({...form, phone: e.target.value})} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label>{t('registration.labelBirthDate')}</label>
              <input 
                name="birth_date"
                type="date"
                onChange={(e) => setForm({...form, birth_date: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label>{t('registration.labelEducation')}</label>
              <input 
                name="education" 
                onChange={(e) => setForm({...form, education: e.target.value})} 
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('registration.labelRole')}</label>
            <select 
              name="role" 
              value={form.role}
              onChange={(e) => setForm({...form, role: e.target.value})} 
            >
              <option value="Staff">Staff</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
          </div>

          <button type="submit" className="btn-auth-primary">{t('registration.btnCreateAccount')}</button>
        </form>

        <p className="auth-footer">
          {t('registration.textHaveAccount')} <Link to="/login" className="auth-link">{t('registration.linkLogin')}</Link>
        </p>
      </div>
    </div>
  );
}