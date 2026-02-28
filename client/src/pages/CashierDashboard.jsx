import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../db/api';
import './CashierDashboard.css';

export default function CashierDashboard({ roundId, roundInfo }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // We expose a generic refresh function so parent Socket can trigger it
  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/sales-round/${roundId}/analytics`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roundId) {
      fetchAnalytics();
    }
  }, [roundId]);

  // Use an interval to poll every 10 seconds just in case websocket misses something, 
  // or rely purely on websocket. We'll do a 15-second fallback poll.
  useEffect(() => {
    if (!roundId) return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 15000);
    return () => clearInterval(interval);
  }, [roundId]);

  if (loading || !data) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>กำลังโหลดข้อมูล Dashboard...</div>;
  }

  const { metrics, hourlySales, topProducts, categorySplit, paymentSplit } = data;

  const formatCurrency = (amt) => {
    return `฿${Number(amt).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="dashboard-container">
      {/* 1. Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">{t('dashboard.totalSales')}</div>
          <div className="metric-value highlight">{formatCurrency(metrics.totalSales)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">{t('dashboard.totalOrders')}</div>
          <div className="metric-value">{metrics.totalOrders} {t('dashboard.bills')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">{t('dashboard.avgBasketValue')}</div>
          <div className="metric-value">{formatCurrency(metrics.avgBasketValue)}</div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* 2. Visual Trends (Hourly Sales Chart) */}
        <div className="chart-card">
          <h3 className="card-title">{t('dashboard.hourlySalesTrend')}</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={hourlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6C727F' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6C727F' }} tickFormatter={(val) => `฿${val}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), t('dashboard.sales')]} labelStyle={{ color: '#111' }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary-orange)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary-orange)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top Performing Products */}
        <div className="top-products-card">
          <h3 className="card-title">{t('dashboard.top5Products')}</h3>
          {topProducts.length === 0 ? (
            <p className="empty-text">{t('dashboard.noSalesData')}</p>
          ) : (
            <div className="top-products-list">
              {topProducts.map((p, idx) => (
                <div key={idx} className="top-product-item">
                  <div className="tp-left">
                    <span className="tp-rank">{idx + 1}</span>
                    <span className="tp-name">{p.name}</span>
                  </div>
                  <div className="tp-right">
                    <div className="tp-qty">{p.quantity} {t('dashboard.pieces')}</div>
                    <div className="tp-rev">{formatCurrency(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-row">
        {/* 4. Payment Methods */}
        <div className="payment-card">
          <h3 className="card-title">{t('dashboard.paymentMethods')}</h3>
          {paymentSplit.length === 0 ? (
            <p className="empty-text">{t('dashboard.noData')}</p>
          ) : (
            paymentSplit.map((pm, idx) => (
              <div key={idx} className="payment-row">
                <span className="pm-name">{pm.name === 'Cash' ? t('dashboard.cash') : pm.name === 'Credit Card' ? t('dashboard.creditCard') : pm.name === 'QR' ? t('dashboard.qr') : pm.name}</span>
                <span className="pm-val">{formatCurrency(pm.value)}</span>
              </div>
            ))
          )}
        </div>

        {/* Categories Split */}
        <div className="category-card">
          <h3 className="card-title">{t('dashboard.categorySales')}</h3>
          {categorySplit.length === 0 ? (
             <p className="empty-text">{t('dashboard.noData')}</p>
          ) : (
            categorySplit.map((c, idx) => (
              <div key={idx} className="category-row">
                <span className="cat-name">{c.name}</span>
                <span className="cat-val">{formatCurrency(c.value)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
