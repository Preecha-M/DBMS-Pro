import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, ReceiptText, ShoppingCart, History, Package, Users, Flame, Coffee, Store } from "lucide-react";
import api from '../db/api';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Data state
  const [stats, setStats] = useState({ todaySales: 0, todayBills: 0 });
  const [topItems, setTopItems] = useState([]);
  const [hasOpenRound, setHasOpenRound] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Check for current open round
        const currentRoundRes = await api.get('/sales-round/current');
        const currentRound = currentRoundRes.data;

        if (!currentRound) {
          // No open round
          setHasOpenRound(false);
          setStats({ todaySales: 0, todayBills: 0 });
          setTopItems([]);
          return;
        }

        setHasOpenRound(true);
        const roundId = currentRound.round_id;

        // 2. Fetch analytics for the current round
        const analyticsRes = await api.get(`/sales-round/${roundId}/analytics`);
        const { metrics, topProducts } = analyticsRes.data;

        setStats({
          todaySales: Number(metrics?.totalSales) || 0,
          todayBills: Number(metrics?.totalOrders) || 0
        });

        // Get top 3 overall products
        setTopItems((topProducts || []).slice(0, 3));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback on error
        setHasOpenRound(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="home-dashboard page-pad">
      <h2 className="dashboard-title">{t('home.title')}</h2>

      {/* Quick Stats Section */}
      <section className="stats-section">
        <div className="stat-card earning-card">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-details">
            <span className="stat-label">{t('home.currentSales')}</span>
            <span className="stat-value">
              {loading ? "..." : (hasOpenRound ? `฿${stats.todaySales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : t('home.notOpen'))}
            </span>
          </div>
        </div>
        <div className="stat-card bills-card">
          <div className="stat-icon"><ReceiptText size={32} /></div>
          <div className="stat-details">
            <span className="stat-label">{t('home.currentBills')}</span>
            <span className="stat-value">
              {loading ? "..." : (hasOpenRound ? `${stats.todayBills} ${t('home.bills')}` : t('home.notOpen'))}
            </span>
          </div>
        </div>
      </section>

      <div className="mobile-primary-action">
        <button className="btn-massive-primary" onClick={() => navigate("/new-order")}>
          <ShoppingCart size={28} />
          {t('home.newOrder')}
        </button>
      </div>

      <section className="actions-section">
        {/* Desktop only new order card */}
        <button className="action-card primary desktop-only-action" onClick={() => navigate("/new-order")}>
          <div className="action-icon"><ShoppingCart size={28} /></div>
          <div className="action-text">
            <h3>{t('home.newOrder')}</h3>
            <p>{t('home.newOrderDesc')}</p>
          </div>
        </button>

        <button className="action-card secondary" onClick={() => navigate("/inventory")}>
          <div className="action-icon"><Package size={28} /></div>
          <div className="action-text mobile-center-text">
            <h3>{t('home.inventory')}</h3>
            <p className="desktop-only-action">{t('home.inventoryDesc')}</p>
          </div>
        </button>

        <button className="action-card secondary" onClick={() => navigate("/members")}>
          <div className="action-icon"><Users size={28} /></div>
          <div className="action-text mobile-center-text">
            <h3>{t('home.members')}</h3>
            <p className="desktop-only-action">{t('home.membersDesc')}</p>
          </div>
        </button>

        <button className="action-card secondary" onClick={() => navigate("/sales-history")}>
          <div className="action-icon"><History size={28} /></div>
          <div className="action-text mobile-center-text">
            <h3>{t('home.salesHistory')}</h3>
            <p className="desktop-only-action">{t('home.salesHistoryDesc')}</p>
          </div>
        </button>

        <button className="action-card secondary mobile-only-action" onClick={() => navigate("/cashier")}>
          <div className="action-icon"><Store size={28} /></div>
          <div className="action-text mobile-center-text">
            <h3>{t('nav.cashier') || 'หน้าสั่งออเดอร์/เปิดกะ'}</h3>
          </div>
        </button>
      </section>

      <section className="top-selling-section">
        <h3 className="section-subtitle"><Flame size={24} style={{ color: '#ff6b6b' }} /> {t('home.topItems')}</h3>
        {loading ? (
           <p style={{ color: '#888' }}>{t('home.loading')}</p>
        ) : !hasOpenRound ? (
           <p style={{ color: '#888' }}>{t('home.noDataNotOpen')}</p>
        ) : topItems.length === 0 ? (
           <p style={{ color: '#888' }}>{t('home.noSalesThisRound')}</p>
        ) : (
          <ul className="top-items-list">
            {topItems.map((item, index) => (
              <li key={index} className="top-item">
                <span className="item-rank">{index + 1}</span>
                <span className="item-name">{item.name}</span>
                <span className="item-qty">{item.quantity} {t('home.cups')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
