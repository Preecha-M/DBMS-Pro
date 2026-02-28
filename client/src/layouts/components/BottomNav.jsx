import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, Search, Settings, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import './BottomNav.css';

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = ["admin", "manager"].includes(String(user?.role || "").toLowerCase());
  
  const [openSettings, setOpenSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setOpenSettings(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="bottom-nav-bar">
      <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>{t('nav.home') || 'หน้าหลัก'}</span>
      </NavLink>

      <NavLink to="/sales-history" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FileText size={24} />
        <span>{t('nav.salesHistory') || 'บิลขาย'}</span>
      </NavLink>

      <div className="bottom-nav-fab-container">
        <button className="bottom-nav-fab" onClick={() => navigate('/new-order')}>
          <Plus size={32} color="#fff" strokeWidth={3} />
        </button>
        <span className="fab-label">{t('nav.newOrder') || 'ขาย'}</span>
      </div>

      <NavLink to="/members" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Search size={24} />
        <span>{t('nav.members') || 'สมาชิก'}</span>
      </NavLink>

      {isAdmin && (
        <div ref={settingsRef} className="bottom-nav-settings-wrapper">
          <button 
            type="button"
            onClick={() => setOpenSettings(!openSettings)}
            className={`bottom-nav-item ${location.pathname.startsWith('/settings') || location.pathname === '/inventory' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', width: '100%', padding: 0 }}
          >
            <Settings size={24} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {t('nav.settings') || 'ตั้งค่า'} {openSettings ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </button>

          {openSettings && (
            <div className="bottom-nav-dropdown">
              <NavLink to="/settings/menus" className={({ isActive }) => `bottom-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setOpenSettings(false)}>• &nbsp;{t('nav.menus')}</NavLink>
              <NavLink to="/settings/categories" className={({ isActive }) => `bottom-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setOpenSettings(false)}>• &nbsp;{t('nav.categories')}</NavLink>
              <NavLink to="/settings/options" className={({ isActive }) => `bottom-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setOpenSettings(false)}>• &nbsp;{t('nav.options')}</NavLink>
              <NavLink to="/inventory" className={({ isActive }) => `bottom-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setOpenSettings(false)}>• &nbsp;{t('nav.inventory')}</NavLink>
              <NavLink to="/settings/promotions" className={({ isActive }) => `bottom-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setOpenSettings(false)}>• &nbsp;{t('nav.promotions')}</NavLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
