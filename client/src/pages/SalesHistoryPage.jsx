import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, History, ChevronRight, X } from "lucide-react";
import api from "../db/api";
import "./SalesHistoryPage.css";

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("day");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [selectedSale, setSelectedSale] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = { mode };
      if (mode === "custom") params.month = month;
      if (mode === "day") params.date = date;

      const res = await api.get("/sales", { params });
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, [mode, month, date]);

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const FILTERS = [
    { key: "day",    label: t('salesHistory.daily') },
    { key: "month",  label: t('salesHistory.thisMonth') },
    { key: "year",   label: t('salesHistory.thisYear') },
    { key: "custom", label: t('salesHistory.selectMonth') },
  ];

  const totalRevenue = sales.reduce((s, r) => s + Number(r.net_total || 0), 0);

  return (
    <div className="pos-page sales-history-page">
      <div className="page-pad">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary-orange), #ff8c5a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <History size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t('salesHistory.title')}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9EA3AE' }}>
              {sales.length} {t('salesHistory.totalItems', { count: '' }).replace('0', '').trim()} · ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-pill ${mode === f.key ? 'active' : ''}`}
              onClick={() => setMode(f.key)}
              style={{ fontFamily: 'inherit' }}
            >
              {f.label}
            </button>
          ))}

          {mode === "day" && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <CalendarDays size={15} style={{ position: 'absolute', left: 10, color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '1.5px solid var(--border-color)', borderRadius: 10,
                  fontFamily: 'inherit', fontSize: 14, outline: 'none', cursor: 'pointer',
                  color: '#19191C', background: '#fff',
                }}
              />
            </div>
          )}

          {mode === "custom" && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <CalendarDays size={15} style={{ position: 'absolute', left: 10, color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '1.5px solid var(--border-color)', borderRadius: 10,
                  fontFamily: 'inherit', fontSize: 14, outline: 'none', cursor: 'pointer',
                  color: '#19191C', background: '#fff',
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9EA3AE' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            {t('salesHistory.loading')}
          </div>
        ) : sales.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: '#9EA3AE' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t('salesHistory.noSalesData')}</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>{t('salesHistory.receipt')}</th>
                    <th>{t('salesHistory.date')}</th>
                    <th className="hide-on-mobile">{t('salesHistory.member')}</th>
                    <th className="hide-on-mobile">{t('salesHistory.employee')}</th>
                    <th className="hide-on-mobile">{t('salesHistory.payment')}</th>
                    <th className="col-right">{t('salesHistory.netTotal')}</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr
                      key={s.sale_id}
                      onClick={() => setSelectedSale(s)}
                      style={{ cursor: 'pointer' }}
                      className="mobile-interactive-row"
                    >
                      <td data-label={t('salesHistory.receipt')} className="col-receipt">
                        <span style={{ fontWeight: 700, color: '#19191C' }}>
                          {s.receipt_number || `#${s.sale_id}`}
                        </span>
                      </td>

                      <td data-label={t('salesHistory.date')} className="col-date">
                        <div className="date-main">{formatDate(s.sale_datetime)}</div>
                        <div className="date-sub">{formatTime(s.sale_datetime)}</div>
                      </td>

                      <td data-label={t('salesHistory.member')} className="hide-on-mobile" style={{ color: s.member_name ? '#19191C' : '#c4c9d4' }}>
                        {s.member_name || "—"}
                      </td>
                      <td data-label={t('salesHistory.employee')} className="hide-on-mobile" style={{ color: '#6C727F' }}>
                        {s.employee_username}
                      </td>

                      <td data-label={t('salesHistory.payment')} className="hide-on-mobile">
                        <span className="payment-badge">{s.payment_method}</span>
                      </td>

                      <td className="col-right" data-label={t('salesHistory.netTotal')}
                        style={{ fontWeight: 800, color: 'var(--primary-orange)', fontSize: 15 }}>
                        ฿{Number(s.net_total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="hide-on-mobile">
                        <ChevronRight size={16} color="#c4c9d4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fafafa', borderRadius: '0 0 18px 18px'
            }}>
              <span style={{ fontSize: 13, color: '#9EA3AE' }}>
                {t('salesHistory.totalItems', { count: sales.length })}
              </span>
              <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary-orange)' }}>
                ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 16, boxSizing: 'border-box'
        }}>
          <div className="card" style={{ width: 500, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedSale.receipt_number || `#${selectedSale.sale_id}`}</div>
                <div style={{ fontSize: 12, color: '#9EA3AE', marginTop: 2 }}>
                  {formatDate(selectedSale.sale_datetime)} · {formatTime(selectedSale.sale_datetime)}
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border-color)',
                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {/* Meta info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 20 }}>
                {[
                  [t('salesHistory.member'), selectedSale.member_name || '—'],
                  [t('salesHistory.payment'), selectedSale.payment_method],
                  [t('salesHistory.employee'), selectedSale.employee_username],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8f9fc', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ color: '#9EA3AE', fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ fontWeight: 800, fontSize: 13, color: '#6C727F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                รายการสินค้า ({(selectedSale.items || []).length})
              </div>

              {(!selectedSale.items || selectedSale.items.length === 0) ? (
                <div style={{ textAlign: 'center', color: '#c4c9d4', padding: '20px 0' }}>ไม่มีรายละเอียด</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedSale.items.map((it, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '10px 14px', background: '#f8f9fc', borderRadius: 10
                    }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{it.quantity}× {it.menu_name || it.menu_id}</div>
                        {it.options && it.options.length > 0 && (
                          <div style={{ fontSize: 12, color: '#9EA3AE', marginTop: 3 }}>
                            {it.options.map((opt, oi) => <span key={oi}>+ {opt.option_name} </span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--primary-orange)' }}>
                        ฿{(Number(it.unit_price) * Number(it.quantity)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: 20, borderTop: '1px solid var(--border-color)', background: '#fafafa', borderRadius: '0 0 18px 18px' }}>
              {Number(selectedSale.discount_amount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#9EA3AE' }}>
                  <span>ส่วนลด/คูปอง</span>
                  <span>-฿{Number(selectedSale.discount_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{t('salesHistory.netTotal')}</span>
                <span style={{ fontWeight: 900, fontSize: 26, color: 'var(--primary-orange)' }}>
                  ฿{Number(selectedSale.net_total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
