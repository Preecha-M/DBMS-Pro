import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, History, ChevronRight, X } from "lucide-react";
import api from "../db/api";
import { useAuth } from "../auth/useAuth";
import "./SalesHistoryPage.css";

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("day");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTaxInvoice, setShowTaxInvoice] = useState(false);
  const [showTaxInvoiceForm, setShowTaxInvoiceForm] = useState(false);
  const [showFullTaxInvoice, setShowFullTaxInvoice] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', taxId: '', address: '', branch: '', notes: '' });
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [savingInvoice, setSavingInvoice] = useState(false);

  const defaultStore = { name: "Nap's Coffee x Khon Kaen", address: "ตลาด 62 บล็อก 157/89-91 ม.16 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000", taxId: "0123456789012", phone: "0844041113" };
  const [storeInfo, setStoreInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('storeInfo');
      return saved ? { ...defaultStore, ...JSON.parse(saved) } : defaultStore;
    } catch { return defaultStore; }
  });
  const [showStoreEdit, setShowStoreEdit] = useState(false);

  const updateStoreInfo = (updates) => {
    const updated = { ...storeInfo, ...updates };
    setStoreInfo(updated);
    localStorage.setItem('storeInfo', JSON.stringify(updated));
  };

  // Close everything when closing the modal
  const handleCloseModal = () => {
    setSelectedSale(null);
    setShowReceipt(false);
    setShowTaxInvoice(false);
    setShowTaxInvoiceForm(false);
    setShowFullTaxInvoice(false);
    setShowPrintMenu(false);
    setSavedInvoice(null);
    setCustomerInfo({ name: '', taxId: '', address: '', branch: '', notes: '' });
  };

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

  const voidSale = async () => {
    if (!selectedSale) return;
    if (!window.confirm(t('salesHistory.confirmVoid', 'คุณแน่ใจหรือไม่ที่จะยกเลิกบิลนี้? ข้อมูลยอดขายและแต้มจะถูกหักกลับ'))) return;
    
    try {
      await api.delete(`/sales/${selectedSale.sale_id}`);
      alert(t('salesHistory.voidSuccess', 'ยกเลิกบิลสำเร็จ'));
      setSelectedSale(null);
      loadSales();
    } catch (err) {
      alert(err.response?.data?.message || t('salesHistory.voidFailed', 'ไม่สามารถยกเลิกบิลได้'));
    }
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });

  const FILTERS = [
    { key: "day",    label: t('salesHistory.daily') },
    { key: "month",  label: t('salesHistory.thisMonth') },
    { key: "year",   label: t('salesHistory.thisYear') },
    { key: "custom", label: t('salesHistory.selectMonth') },
  ];

  const totalRevenue = sales.reduce((s, r) => s + (r.status === 'VOIDED' ? 0 : Number(r.net_total || 0)), 0);
  const activeSales = sales.filter(s => s.status !== 'VOIDED');

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
              {activeSales.length} {t('salesHistory.totalItems', { count: '' }).replace('0', '').trim()} · ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
                      style={{ 
                        cursor: 'pointer',
                        opacity: s.status === 'VOIDED' ? 0.5 : 1
                      }}
                      className="mobile-interactive-row"
                    >
                      <td data-label={t('salesHistory.receipt')} className="col-receipt">
                        <span style={{ fontWeight: 700, color: '#19191C' }}>
                          {s.receipt_number || `#${s.sale_id}`}
                        </span>
                        {s.status === 'VOIDED' && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                            {t('salesHistory.voided', 'ยกเลิก')}
                          </span>
                        )}
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
                        style={{ 
                          fontWeight: 800, 
                          color: s.status === 'VOIDED' ? '#9EA3AE' : 'var(--primary-orange)', 
                          textDecoration: s.status === 'VOIDED' ? 'line-through' : 'none',
                          fontSize: 15 
                        }}>
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
                {t('salesHistory.totalItems', { count: activeSales.length })}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {selectedSale.receipt_number || `#${selectedSale.sale_id}`}
                  </div>
                  {selectedSale.status === 'VOIDED' && (
                    <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>
                      {t('salesHistory.voidedBadge', 'บิลถูกยกเลิก')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9EA3AE', marginTop: 2 }}>
                  {formatDate(selectedSale.sale_datetime)} · {formatTime(selectedSale.sale_datetime)}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
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
              <div className="modal-actions" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {selectedSale.status !== 'VOIDED' && user && ['Manager', 'Owner', 'Admin'].includes(user.role) && (
                    <button 
                      className="btn-soft" 
                      style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }} 
                      onClick={voidSale}
                    >
                      {t('salesHistory.voidBtn', 'ยกเลิกบิล')}
                    </button>
                  )}
                </div>
                {selectedSale.status !== 'VOIDED' && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                  >
                    {t('salesHistory.printDoc', 'พิมพ์เอกสาร')} ▾
                  </button>
                  {showPrintMenu && (
                    <div className="pos-dropdown-menu" style={{ right: 0, left: 'auto', bottom: '100%', top: 'auto', marginBottom: 8 }}>
                      <a href="#!" className="pos-dropdown-link" style={{ fontSize: 13 }} onClick={(e) => { e.preventDefault(); setShowPrintMenu(false); setShowTaxInvoiceForm(true); }}>
                        {t('salesHistory.printFullTaxInvoice', 'พิมพ์ใบกำกับภาษีเต็มรูป')}
                      </a>
                      <a href="#!" className="pos-dropdown-link" style={{ fontSize: 13 }} onClick={(e) => { e.preventDefault(); setShowPrintMenu(false); setShowTaxInvoice(true); }}>
                        {t('salesHistory.printTaxInvoice', 'พิมพ์ใบกำกับภาษีอย่างย่อ')}
                      </a>
                      <a href="#!" className="pos-dropdown-link" style={{ fontSize: 13 }} onClick={(e) => { e.preventDefault(); setShowPrintMenu(false); setShowReceipt(true); }}>
                        {t('salesHistory.printReceipt', 'พิมพ์ใบเสร็จ')}
                      </a>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {selectedSale && showReceipt && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-card receipt print-area">
            <button className="modal-x no-print" onClick={() => setShowReceipt(false)}>
              ×
            </button>

            <div className="receipt-brand" style={{ fontSize: 24, marginBottom: 4 }}>{storeInfo.name}</div>

            <div style={{ fontSize: 12, textAlign: 'center', color: '#6C727F', marginBottom: 14 }}>
              {storeInfo.address}<br/>
              เบอร์โทร : {storeInfo.phone}
            </div>

            <div className="receipt-block">
              <div><b>Receipt</b></div>
              <div>No: {selectedSale.receipt_number || selectedSale.sale_id}</div>
              <div>
                Date: {new Intl.DateTimeFormat("th-TH", {
                  year: "numeric", month: "numeric", day: "numeric",
                  hour: "numeric", minute: "numeric", second: "numeric",
                  hour12: false, timeZone: "Asia/Bangkok",
                }).format(new Date(selectedSale.sale_datetime.endsWith("Z") ? selectedSale.sale_datetime : selectedSale.sale_datetime + "Z"))}
              </div>
              <div>Created by: {selectedSale.employee_name || selectedSale.employee_username || "-"}</div>
              <div>Payment: {selectedSale.payment_method}</div>
              <div>Customer: {selectedSale.member_name || "Walk-in Customer"}</div>
            </div>

            <div className="receipt-table">
              <div className="rt-head">
                <div>Name</div>
                <div className="center">Qty</div>
                <div className="right">Subtotal</div>
              </div>
              {(selectedSale.items || []).map((it, idx) => (
                <div className="rt-row" key={idx}>
                  <div>{it.menu_name || it.menu_id}</div>
                  <div className="center">{it.quantity}</div>
                  <div className="right">{(Number(it.unit_price) * it.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="rt-total">
                <div>Total</div>
                <div className="right">{Number(selectedSale.subtotal || 0).toFixed(2)}</div>
              </div>
              {Number(selectedSale.discount_amount || 0) > 0 && (
                <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                  <div>Discount</div>
                  <div className="right">-{Number(selectedSale.discount_amount).toFixed(2)}</div>
                </div>
              )}
              <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                <div><b>Grand Total</b></div>
                <div className="right"><b>{Number(selectedSale.net_total).toFixed(2)}</b></div>
              </div>
              {selectedSale.payment_method === "Cash" && selectedSale.cash_received !== null && (
                <>
                  <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                    <div>Cash received</div>
                    <div className="right">{Number(selectedSale.cash_received).toFixed(2)}</div>
                  </div>
                  <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                    <div>Change</div>
                    <div className="right"><b>{(Number(selectedSale.cash_received) - Number(selectedSale.net_total)).toFixed(2)}</b></div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions no-print">
              <button className="btn-soft" onClick={() => setShowReceipt(false)}>{t('salesHistory.close', 'ปิด')}</button>
              <button className="btn-primary" onClick={() => window.print()}>{t('salesHistory.print', 'พิมพ์')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Print Modal */}
      {selectedSale && showTaxInvoice && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-card receipt print-area">
            <button className="modal-x no-print" onClick={() => setShowTaxInvoice(false)}>
              ×
            </button>

            <div className="receipt-brand" style={{ fontSize: 24, marginBottom: 4 }}>{storeInfo.name}</div>

            <div style={{ fontSize: 12, textAlign: 'center', color: '#6C727F', marginBottom: 14 }}>
              {storeInfo.address}<br/>
              เบอร์โทร : {storeInfo.phone}
            </div>

            <div className="receipt-block">
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>ใบกำกับภาษีอย่างย่อ<br/>(Tax Invoice)</div>
              <div>No: {selectedSale.receipt_number || selectedSale.sale_id}</div>
              <div>
                Date: {new Intl.DateTimeFormat("th-TH", {
                  year: "numeric", month: "numeric", day: "numeric",
                  hour: "numeric", minute: "numeric", second: "numeric",
                  hour12: false, timeZone: "Asia/Bangkok",
                }).format(new Date(selectedSale.sale_datetime.endsWith("Z") ? selectedSale.sale_datetime : selectedSale.sale_datetime + "Z"))}
              </div>
              <div>Customer: {selectedSale.member_name || "Walk-in Customer"}</div>
              <div>TAX ID: {storeInfo.taxId}</div>
              <div>Staff: {selectedSale.employee_name || selectedSale.employee_username || "-"}</div>
            </div>

            <div className="receipt-table">
              <div className="rt-head">
                <div>Name</div>
                <div className="center">Qty</div>
                <div className="right">Subtotal</div>
              </div>
              {(selectedSale.items || []).map((it, idx) => (
                <div className="rt-row" key={idx}>
                  <div>{it.menu_name || it.menu_id}</div>
                  <div className="center">{it.quantity}</div>
                  <div className="right">{(Number(it.unit_price) * it.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="rt-total">
                <div>Total</div>
                <div className="right">{Number(selectedSale.subtotal || 0).toFixed(2)}</div>
              </div>
              {Number(selectedSale.discount_amount || 0) > 0 && (
                <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                  <div>Discount</div>
                  <div className="right">-{Number(selectedSale.discount_amount).toFixed(2)}</div>
                </div>
              )}
              
              {/* Vatable and VAT details */}
              {(() => {
                const netAmount = Number(selectedSale.net_total);
                const vatRate = 0.07;
                const vatable = netAmount / (1 + vatRate);
                const vatAmount = netAmount - vatable;
                
                return (
                  <>
                    <div className="rt-total" style={{ borderTop: "none", paddingTop: 0, paddingBottom: 0 }}>
                      <div style={{ fontSize: 12, color: '#6C727F' }}>Vatable Amount</div>
                      <div className="right" style={{ fontSize: 12, color: '#6C727F' }}>{vatable.toFixed(2)}</div>
                    </div>
                    <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                      <div style={{ fontSize: 12, color: '#6C727F' }}>VAT 7%</div>
                      <div className="right" style={{ fontSize: 12, color: '#6C727F' }}>{vatAmount.toFixed(2)}</div>
                    </div>
                  </>
                );
              })()}

              <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                <div><b>Grand Total</b> <span style={{fontSize: 10, fontWeight: 'normal', color: '#6C727F'}}>(VAT Included)</span></div>
                <div className="right"><b>{Number(selectedSale.net_total).toFixed(2)}</b></div>
              </div>
            </div>

            <div className="modal-actions no-print">
              <button className="btn-soft" onClick={() => setShowTaxInvoice(false)}>{t('salesHistory.close', 'ปิด')}</button>
              <button className="btn-primary" onClick={() => window.print()}>{t('salesHistory.print', 'พิมพ์')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Tax Invoice Form Modal */}
      {selectedSale && showTaxInvoiceForm && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="modal-title">ข้อมูลสำหรับออกใบกำกับภาษีเต็มรูป</div>
              <button className="modal-x" onClick={() => setShowTaxInvoiceForm(false)} style={{ position: 'relative', top: 0, right: 0 }}>×</button>
            </div>

            {/* Store Info Section */}
            <div style={{ marginBottom: 16, background: '#f8f9fc', borderRadius: 12, padding: '12px 16px' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowStoreEdit(!showStoreEdit)}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#6C727F' }}>
                  ข้อมูลร้าน (ผู้ออกใบกำกับภาษี) — {storeInfo.name}
                </div>
                <span style={{ fontSize: 12, color: 'var(--primary-orange)', fontWeight: 600 }}>
                  {showStoreEdit ? 'ย่อ ▴' : 'แก้ไข ▾'}
                </span>
              </div>
              {showStoreEdit && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>ชื่อร้าน (Store Name)</label>
                    <input type="text" value={storeInfo.name} onChange={e => updateStoreInfo({ name: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>ที่อยู่ร้าน (Store Address)</label>
                    <textarea 
                      value={storeInfo.address} 
                      onChange={e => updateStoreInfo({ address: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', minHeight: 60 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>เลขประจำตัวผู้เสียภาษีร้าน (Tax ID)</label>
                      <input type="text" value={storeInfo.taxId} onChange={e => updateStoreInfo({ taxId: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>เบอร์โทรร้าน (Phone)</label>
                      <input type="text" value={storeInfo.phone} onChange={e => updateStoreInfo({ phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, color: '#6C727F', marginBottom: 10 }}>ข้อมูลลูกค้า</div>
            
            <div className="input-group">
              <label>ชื่อ-นามสกุล / ชื่อบริษัท (Customer Name / Company Name)</label>
              <input 
                type="text" 
                value={customerInfo.name} 
                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                placeholder="กรอกชื่อลูกค้าหรือบริษัท"
              />
            </div>
            
            <div className="input-group">
              <label>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
              <input 
                type="text" 
                value={customerInfo.taxId} 
                onChange={e => setCustomerInfo({...customerInfo, taxId: e.target.value})} 
                placeholder="กรอกเลขประจำตัว 13 หลัก"
              />
            </div>
            
            <div className="input-group">
              <label>ที่อยู่ (Address)</label>
              <textarea 
                value={customerInfo.address} 
                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} 
                placeholder="กรอกที่อยู่สำหรับออกใบกำกับภาษี"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--border-color)', boxSizing: 'border-box',
                  fontFamily: 'inherit', resize: 'vertical', minHeight: 80
                }}
              />
            </div>

            <div className="input-group">
              <label>สาขา (Branch) <span style={{ color: '#9EA3AE', fontWeight: 400 }}>- ไม่บังคับ</span></label>
              <input 
                type="text" 
                value={customerInfo.branch} 
                onChange={e => setCustomerInfo({...customerInfo, branch: e.target.value})} 
                placeholder="เช่น สำนักงานใหญ่ / สาขาที่ 1"
              />
            </div>

            <div className="input-group">
              <label>หมายเหตุ (Notes) <span style={{ color: '#9EA3AE', fontWeight: 400 }}>- ไม่บังคับ</span></label>
              <textarea 
                value={customerInfo.notes} 
                onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})} 
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--border-color)', boxSizing: 'border-box',
                  fontFamily: 'inherit', resize: 'vertical', minHeight: 60
                }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-soft" onClick={() => setShowTaxInvoiceForm(false)}>{t('salesHistory.cancel', 'ยกเลิก')}</button>
              <button 
                className="btn-primary" 
                disabled={!customerInfo.name || !customerInfo.taxId || !customerInfo.address || savingInvoice}
                onClick={async () => {
                  try {
                    setSavingInvoice(true);
                    const netAmount = Number(selectedSale.net_total);
                    const vatRate = 7.00;
                    const vatable = netAmount / (1 + vatRate / 100);
                    const vatAmount = netAmount - vatable;

                    const res = await api.post('/tax-invoices', {
                      sale_id: selectedSale.sale_id,
                      customer_name: customerInfo.name,
                      customer_tax_id: customerInfo.taxId,
                      customer_address: customerInfo.address,
                      customer_branch: customerInfo.branch || null,
                      store_name: storeInfo.name,
                      store_address: storeInfo.address,
                      store_tax_id: storeInfo.taxId,
                      store_phone: storeInfo.phone,
                      subtotal: vatable,
                      vat_rate: vatRate,
                      vat_amount: vatAmount,
                      total_amount: netAmount,
                      notes: customerInfo.notes || null,
                    });
                    setSavedInvoice(res.data);
                    setShowTaxInvoiceForm(false);
                    setShowFullTaxInvoice(true);
                  } catch (err) {
                    alert(err.response?.data?.message || 'ไม่สามารถบันทึกใบกำกับภาษีได้');
                  } finally {
                    setSavingInvoice(false);
                  }
                }}
              >
                {savingInvoice ? 'กำลังบันทึก...' : 'บันทึกและพิมพ์ (Save & Print)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Tax Invoice Print Modal */}
      {selectedSale && showFullTaxInvoice && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-card wide print-area" style={{ padding: '40px' }}>
            <button className="modal-x no-print" onClick={() => setShowFullTaxInvoice(false)}>
              ×
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary-orange)' }}>{storeInfo.name}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {storeInfo.address}<br/>
                  TAX ID: {storeInfo.taxId}<br/>
                  Tel: {storeInfo.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>ใบกำกับภาษีเต็มรูป</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#666' }}>(TAX INVOICE)</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 14 }}>ข้อมูลลูกค้า (Customer)</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <div><b>นาม (Name):</b> {customerInfo.name}</div>
                  <div><b>เลขผู้เสียภาษี (Tax ID):</b> {customerInfo.taxId}</div>
                  <div><b>ที่อยู่ (Address):</b> {customerInfo.address}</div>
                </div>
              </div>
              <div style={{ width: 250 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 14 }}>ข้อมูลเอกสาร (Document Info)</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, background: '#f8f9fc', padding: 12, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เลขที่ (No):</span>
                    <b>{savedInvoice?.invoice_number || selectedSale.receipt_number || selectedSale.sale_id}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>วันที่ (Date):</span>
                    <b>{new Intl.DateTimeFormat("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(selectedSale.sale_datetime.endsWith("Z") ? selectedSale.sale_datetime : selectedSale.sale_datetime + "Z"))}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>พนักงาน (Staff):</span>
                    <b>{selectedSale.employee_name || selectedSale.employee_username || "-"}</b>
                  </div>
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f4f7fe', borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: 50 }}>ลำดับ<br/>(Item)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>รายการสินค้า<br/>(Description)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: 80 }}>จำนวน<br/>(Qty)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', width: 100 }}>ราคา/หน่วย<br/>(Unit Price)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', width: 120 }}>จำนวนเงิน<br/>(Amount)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedSale.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {it.menu_name || it.menu_id}
                      {it.options && it.options.length > 0 && (
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {it.options.map(o => `+${o.option_name}`).join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{Number(it.unit_price).toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{(Number(it.unit_price) * it.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <div style={{ width: 300, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                  <span>รวมเป็นเงิน (Sub total):</span>
                  <span>{Number(selectedSale.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(selectedSale.discount_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                    <span>ส่วนลด (Discount):</span>
                    <span>-{Number(selectedSale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                
                {(() => {
                  const netAmount = Number(selectedSale.net_total);
                  const vatRate = 0.07;
                  const vatable = netAmount / (1 + vatRate);
                  const vatAmount = netAmount - vatable;
                  
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <span>มูลค่าสินค้าที่ไม่มี/ยกเว้นภาษี:</span>
                        <span>0.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <span>มูลค่าสินค้าที่เสียภาษี (Vatable):</span>
                        <span>{vatable.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%):</span>
                        <span>{vatAmount.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 8px', background: '#f4f7fe', fontWeight: 900, borderTop: '2px solid #111', borderBottom: '2px solid #111', marginTop: 8, fontSize: 14 }}>
                  <span>จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
                  <span>{Number(selectedSale.net_total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: 13 }}>
              <div style={{ width: 200 }}>
                <div style={{ borderBottom: '1px solid #333', height: 40 }}></div>
                <div style={{ marginTop: 8 }}>ผู้รับเงิน / ผู้รับมอบอำนาจ</div>
                <div style={{ marginTop: 4 }}>___/___/_____</div>
              </div>
              <div style={{ width: 200 }}>
                <div style={{ borderBottom: '1px solid #333', height: 40 }}></div>
                <div style={{ marginTop: 8 }}>ผู้จ่ายเงิน / ลูกค้า</div>
                <div style={{ marginTop: 4 }}>___/___/_____</div>
              </div>
            </div>

            <div className="modal-actions no-print" style={{ marginTop: 40 }}>
              <button className="btn-soft" onClick={() => setShowFullTaxInvoice(false)}>{t('salesHistory.close', 'ปิด')}</button>
              <button className="btn-primary" onClick={() => window.print()}>{t('salesHistory.print', 'พิมพ์')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
