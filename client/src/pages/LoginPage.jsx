import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import welcomeImg from "../assets/welcome.jpg";

export default function LoginPage() {
  const { t } = useTranslation();
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
      setError(err?.response?.data?.message || t('loginPage.errLoginFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side">
        <img
          src={welcomeImg}
          alt="Login"
        />
      </div>

      <div className="auth-form-side">
        <h2 className="auth-title">{t('loginPage.titleWelcome')}</h2>
        <p className="auth-subtitle">{t('loginPage.subtitleLogin')}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label>{t('loginPage.labelUsername')}</label>
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
            <label>{t('loginPage.labelPassword')}</label>
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
            {t('loginPage.btnSignIn')}
          </button>
        </form>

      </div>
    </div>
  );
}
