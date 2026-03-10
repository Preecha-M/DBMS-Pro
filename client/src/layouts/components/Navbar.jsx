import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/useAuth";
import api from "../../db/api";
import { Bell, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  
  const [openUser, setOpenUser] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  
  const isAdmin = ["admin", "owner", "manager"].includes(String(user?.role || "").toLowerCase());
  
  useEffect(() => {
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setOpenUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setOpenSettings(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.get("/ingredients/low-stock?threshold=15")
        .then(res => setLowStockItems(res.data))
        .catch(err => console.error("Failed to load low stock alerts", err));
      
      api.get("/ingredients/alerts?days=7")
        .then(res => {
          setExpiredBatches(res.data.expired || []);
          setExpiringBatches(res.data.expiringSoon || []);
        })
        .catch(err => console.error("Failed to load expiring batches", err));
    }
  }, [isAdmin]);
  
  const totalAlerts = lowStockItems.length + expiredBatches.length + expiringBatches.length;
  
  const onLogout = async () => {
    setOpenUser(false);
    await logout();
    navigate("/login", { replace: true });
  };
  
  const goNewOrder = () => navigate("/new-order");

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('th') ? 'en' : 'th';
    i18n.changeLanguage(nextLang);
  };
  
  if (!user) return null;

  return (
    <header className="pos-topbar">
      <div className="pos-topbar-left">
        {/* Hide hamburger menu because we have bottom nav now */}
        {/* <button 
          className="mobile-menu-btn" 
          onClick={() => setOpenMenu(!openMenu)}
        >
          {openMenu ? <X size={24} color="#19191C" /> : <Menu size={24} color="#19191C" />}
        </button> */}

        <div className="pos-brand" onClick={() => navigate("/home")}>
          CP <span>POS</span>
        </div>
      </div>

      <nav className={`pos-topnav ${openMenu ? 'mobile-open' : ''}`}>
        <NavLink to="/home" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          {t('nav.home')}
        </NavLink>
        <NavLink to="/sales-history" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          {t('nav.salesHistory')}
        </NavLink>
        <NavLink to="/Members" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          {t('nav.members')}
        </NavLink>
        <NavLink to="/cashier" className={({ isActive }) => `pos-toplink ${isActive ? "active" : ""}`} onClick={() => setOpenMenu(false)}>
          {t('nav.cashier')}
        </NavLink>

        {isAdmin && (
          <div ref={settingsRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button
              className={`pos-toplink ${location.pathname.startsWith('/settings') || location.pathname === '/inventory' || location.pathname === '/tax-invoices' ? 'active' : ''}`}
              onClick={() => setOpenSettings(!openSettings)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              {t('nav.settings')} <ChevronDown size={16} color={location.pathname.startsWith('/settings') || location.pathname === '/inventory' ? "var(--primary-orange)" : "#8B90A0"} />
            </button>
            {openSettings && (
              <div className="pos-dropdown-menu">
                <NavLink to="/settings/menus" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.menus')}</NavLink>
                <NavLink to="/settings/categories" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.categories')}</NavLink>
                <NavLink to="/settings/options" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.options')}</NavLink>
                <NavLink to="/inventory" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.inventory')}</NavLink>
                <NavLink to="/settings/promotions" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.promotions')}</NavLink>
                <NavLink to="/settings/employees" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.employees')}</NavLink>
                <NavLink to="/tax-invoices" className={({ isActive }) => `pos-dropdown-link ${isActive ? "active" : ""}`} onClick={() => { setOpenSettings(false); setOpenMenu(false); }}>• &nbsp;{t('nav.taxInvoices', 'ใบกำกับภาษี')}</NavLink>
              </div>
            )}
          </div>
        )}
      </nav>


      <div className="pos-topactions">
        {/* Language Switcher */}
        <button 
          type="button" 
          onClick={toggleLanguage}
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "8px 12px",
            fontWeight: "800",
            cursor: "pointer",
            color: "#19191C",
            fontSize: "14px"
          }}
          title="Switch Language"
        >
          {i18n.language.startsWith('th') ? 'TH' : 'EN'}
        </button>

        <button className="pos-neworder-btn hide-on-mobile" onClick={goNewOrder}>
          {t('nav.newOrder')}
        </button>

        {isAdmin && (
          <div ref={notifRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button 
              className="pos-icon-btn" 
              type="button" 
              title={t('nav.notifications')}
              onClick={() => setOpenNotif(!openNotif)}
              style={{ position: 'relative' }}
            >
              <Bell size={20} color="#19191C" />
              {totalAlerts > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 10,
                  height: 10,
                  background: 'var(--primary-red, #E63946)',
                  borderRadius: '50%',
                  border: '2px solid #fff'
                }}></span>
              )}
            </button>
            {openNotif && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  width: 280,
                  background: "#fff",
                  border: "1px solid var(--border-color)",
                  borderRadius: 14,
                  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                  overflow: "hidden",
                  zIndex: 2000,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: "1px solid var(--border-color)", fontWeight: 900, background: '#f9fafb' }}>
                  {t('nav.notifications')} <span style={{ color: 'var(--primary-red, #E63946)' }}>({totalAlerts})</span>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {totalAlerts === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#9EA3AE', fontSize: 13 }}>
                      {t('nav.noNotifications')}
                    </div>
                  ) : (
                    <>
                      {lowStockItems.map(item => (
                        <div key={`low-${item.ingredient_id}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f5' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#19191C' }}>{item.ingredient_name || item.ingredient_id}</div>
                          <div style={{ fontSize: 13, color: 'var(--primary-red, #E63946)', marginTop: 4 }}>
                            {t('nav.stockRemaining')}: {item.quantity_on_hand} {item.unit || t('nav.unit')}
                          </div>
                        </div>
                      ))}
                      {expiredBatches.map(batch => (
                        <div key={`expired-${batch.batch_id}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f5', borderLeft: '3px solid var(--primary-red, #E63946)' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#19191C' }}>{batch.ingredient?.ingredient_name || batch.ingredient_id}</div>
                          <div style={{ fontSize: 13, color: 'var(--primary-red, #E63946)', marginTop: 4 }}>
                            ⚠️ {t('inventory.expired', 'หมดอายุแล้ว')} - {t('nav.stockRemaining')}: {batch.quantity_on_hand} {batch.ingredient?.unit}
                            <br />
                            Exp: {new Date(batch.expire_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
                          </div>
                        </div>
                      ))}
                      {expiringBatches.map(batch => (
                        <div key={`exp-${batch.batch_id}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f5', borderLeft: '3px solid #f29900' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#19191C' }}>{batch.ingredient?.ingredient_name || batch.ingredient_id}</div>
                          <div style={{ fontSize: 13, color: '#f29900', marginTop: 4 }}>
                            {t('inventory.alertExpiring', 'ใกล้หมดอายุ')} - {t('nav.stockRemaining')}: {batch.quantity_on_hand} {batch.ingredient?.unit}
                            <br />
                            Exp: {new Date(batch.expire_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={userMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="pos-icon-btn"
            onClick={() => setOpenUser((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 999,
            }}
            title={`${user.username} (${user.role})`}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              {String(user.username || "A")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div style={{ fontSize: 14, color: "#6C727F", fontWeight: 900 }}>▾</div>
          </button>

          {openUser && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: 220,
                background: "#fff",
                border: "1px solid var(--border-color)",
                borderRadius: 14,
                boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                overflow: "hidden",
                zIndex: 2000,
              }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{user.username}</div>
                <div style={{ fontSize: 12, color: "#9EA3AE" }}>{user.role}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  border: 0,
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "var(--primary-orange)",
                }}
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}