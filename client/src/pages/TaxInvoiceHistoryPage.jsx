import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, ChevronRight, X, Search } from "lucide-react";
import api from "../db/api";
import "./SalesHistoryPage.css";

export default function TaxInvoiceHistoryPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get("/tax-invoices", { params });
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [startDate, endDate]);

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

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.invoice_number || "").toLowerCase().includes(q) ||
      (inv.customer_name || "").toLowerCase().includes(q) ||
      (inv.customer_tax_id || "").toLowerCase().includes(q)
    );
  });

  const activeInvoices = filtered.filter((inv) => inv.status !== "CANCELLED");
  const totalAmount = activeInvoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0);

  const loadInvoiceDetail = async (inv) => {
    try {
      const res = await api.get(`/tax-invoices/${inv.invoice_id}`);
      setSelectedInvoice(res.data);
    } catch {
      setSelectedInvoice(inv);
    }
  };

  return (
    <div className="pos-page sales-history-page">
      <div className="page-pad">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>ประวัติใบกำกับภาษี</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9EA3AE' }}>
              {activeInvoices.length} รายการ · ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่, ชื่อลูกค้า, Tax ID..."
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1.5px solid var(--border-color)', borderRadius: 10,
                fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '8px 12px', border: '1.5px solid var(--border-color)', borderRadius: 10,
                fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }}
            />
            <span style={{ color: '#9EA3AE', fontSize: 13 }}>ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '8px 12px', border: '1.5px solid var(--border-color)', borderRadius: 10,
                fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9EA3AE' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: '#9EA3AE' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>ไม่พบใบกำกับภาษี</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่</th>
                    <th className="hide-on-mobile">ลูกค้า</th>
                    <th className="hide-on-mobile">Tax ID ลูกค้า</th>
                    <th className="hide-on-mobile">พนักงาน</th>
                    <th className="col-right">ยอดรวม</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => loadInvoiceDetail(inv)}
                      style={{
                        cursor: 'pointer',
                        opacity: inv.status === 'CANCELLED' ? 0.5 : 1
                      }}
                      className="mobile-interactive-row"
                    >
                      <td data-label="เลขที่" className="col-receipt">
                        <span style={{ fontWeight: 700, color: '#19191C' }}>
                          {inv.invoice_number}
                        </span>
                        {inv.status === 'CANCELLED' && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                            ยกเลิก
                          </span>
                        )}
                      </td>
                      <td data-label="วันที่" className="col-date">
                        <div className="date-main">{formatDate(inv.invoice_date)}</div>
                        <div className="date-sub">{formatTime(inv.invoice_date)}</div>
                      </td>
                      <td data-label="ลูกค้า" className="hide-on-mobile" style={{ fontWeight: 600 }}>
                        {inv.customer_name}
                      </td>
                      <td data-label="Tax ID" className="hide-on-mobile" style={{ color: '#6C727F', fontSize: 13 }}>
                        {inv.customer_tax_id}
                      </td>
                      <td data-label="พนักงาน" className="hide-on-mobile" style={{ color: '#6C727F' }}>
                        {inv.employee_username || '—'}
                      </td>
                      <td className="col-right" data-label="ยอดรวม"
                        style={{
                          fontWeight: 800,
                          color: inv.status === 'CANCELLED' ? '#9EA3AE' : 'var(--primary-orange)',
                          textDecoration: inv.status === 'CANCELLED' ? 'line-through' : 'none',
                          fontSize: 15
                        }}>
                        ฿{Number(inv.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
                {activeInvoices.length} รายการ
              </span>
              <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary-orange)' }}>
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 16, boxSizing: 'border-box'
        }}>
          <div className="card" style={{ width: 600, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {selectedInvoice.invoice_number}
                  </div>
                  {selectedInvoice.status === 'CANCELLED' && (
                    <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>
                      ยกเลิกแล้ว
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9EA3AE', marginTop: 2 }}>
                  {formatDate(selectedInvoice.invoice_date)} · {formatTime(selectedInvoice.invoice_date)}
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border-color)',
                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {/* Store info */}
              <div style={{ fontWeight: 800, fontSize: 13, color: '#6C727F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ผู้ออกใบกำกับภาษี
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, marginBottom: 20 }}>
                {[
                  ['ชื่อร้าน', selectedInvoice.store_name || '—'],
                  ['Tax ID ร้าน', selectedInvoice.store_tax_id || '—'],
                  ['ที่อยู่', selectedInvoice.store_address || '—'],
                  ['เบอร์โทร', selectedInvoice.store_phone || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8f9fc', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ color: '#9EA3AE', fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Customer info */}
              <div style={{ fontWeight: 800, fontSize: 13, color: '#6C727F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ข้อมูลลูกค้า
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, marginBottom: 20 }}>
                {[
                  ['ชื่อลูกค้า', selectedInvoice.customer_name],
                  ['Tax ID', selectedInvoice.customer_tax_id],
                  ['ที่อยู่', selectedInvoice.customer_address || '—'],
                  ['สาขา', selectedInvoice.customer_branch || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8f9fc', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ color: '#9EA3AE', fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Sale items */}
              {selectedInvoice.sale?.sale_item && (
                <>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#6C727F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    รายการสินค้า ({selectedInvoice.sale.sale_item.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {selectedInvoice.sale.sale_item.map((it, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: '#f8f9fc', borderRadius: 10
                      }}>
                        <div style={{ fontWeight: 700 }}>{it.quantity}× {it.menu?.menu_name || it.menu_id}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-orange)' }}>
                          ฿{(Number(it.unit_price) * Number(it.quantity)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 14 }}>
                  <div style={{ color: '#92400e', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>หมายเหตุ</div>
                  <div>{selectedInvoice.notes}</div>
                </div>
              )}

              {/* Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, marginBottom: 10 }}>
                {[
                  ['เลขที่บิลอ้างอิง', selectedInvoice.sale?.receipt_number || '—'],
                  ['พนักงาน', selectedInvoice.employee_name || selectedInvoice.employee_username || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8f9fc', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ color: '#9EA3AE', fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: 20, borderTop: '1px solid var(--border-color)', background: '#fafafa', borderRadius: '0 0 18px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
                <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ color: '#9EA3AE', fontSize: 11 }}>Subtotal</div>
                  <div style={{ fontWeight: 700 }}>฿{Number(selectedInvoice.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ color: '#9EA3AE', fontSize: 11 }}>VAT {Number(selectedInvoice.vat_rate)}%</div>
                  <div style={{ fontWeight: 700 }}>฿{Number(selectedInvoice.vat_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#fff7ed', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary-orange)', fontSize: 11, fontWeight: 700 }}>รวมทั้งสิ้น</div>
                  <div style={{ fontWeight: 900, color: 'var(--primary-orange)', fontSize: 16 }}>฿{Number(selectedInvoice.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-soft" onClick={() => setSelectedInvoice(null)}>{t('salesHistory.close', 'ปิด')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
