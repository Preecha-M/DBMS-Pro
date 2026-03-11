import { useStoreConfig } from '../../context/StoreConfigContext';
import { bahtToText } from '../../utils/bahtToText';
import './print.css';

const formatThaiDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const thaiNumber = (n) =>
  Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_LABEL = {
  Pending: 'รอดำเนินการ',
  Partial: 'รับบางส่วน',
  Received: 'รับแล้ว',
  Cancelled: 'ยกเลิก',
};

const PAYMENT_LABEL = {
  Cash: 'เงินสด',
  Transfer: 'โอนเงิน',
  Credit: 'เครดิต',
};

/**
 * ใบสั่งซื้อ — Purchase Order
 * Props:
 *   order: object จาก API /orders (หรือ created order)
 *     { po_number, order_date, delivery_date, order_status, supplier_name,
 *       payment_terms, payment_method, credit_days, notes,
 *       subtotal, tax_rate, tax_amount, total_amount,
 *       items: [{ ingredient_name, unit, quantity, received_quantity, unit_cost }] }
 */
export default function PurchaseOrderDocument({ order }) {
  const { config: STORE_CONFIG } = useStoreConfig();
  if (!order) return null;

  const items = order.items || [];

  // คำนวณถ้าไม่มีข้อมูลในฐานข้อมูล
  const subtotal = order.subtotal
    ? Number(order.subtotal)
    : items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_cost || 0)), 0);

  const taxRate = order.tax_rate != null ? Number(order.tax_rate) : 7;
  const taxAmount = order.tax_amount != null ? Number(order.tax_amount) : (subtotal * taxRate) / 100;
  const totalAmount = order.total_amount != null ? Number(order.total_amount) : subtotal + taxAmount;

  return (
    <div className="print-doc-page">
      {/* ======= HEADER ======= */}
      <div className="doc-header">
        <p className="doc-store-name">{STORE_CONFIG.name}</p>
        <p className="doc-store-sub">{STORE_CONFIG.address}</p>
        <p className="doc-store-sub">
          {STORE_CONFIG.taxId !== '-' && `เลขประจำตัวผู้เสียภาษี: ${STORE_CONFIG.taxId}`}
          {STORE_CONFIG.phone !== '-' && ` | โทร: ${STORE_CONFIG.phone}`}
          {` | ${STORE_CONFIG.branch}`}
        </p>
      </div>

      {/* ======= TITLE ======= */}
      <div className="doc-title">ใบสั่งซื้อ</div>
      <div className="doc-title-en">PURCHASE ORDER</div>

      {/* ======= INFO GRID ======= */}
      <div className="doc-info-grid">
        {/* ซ้าย: ผู้รับ / ซัพพลายเออร์ */}
        <div className="doc-info-box">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>เรียน (To)</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{order.supplier_name || '-'}</div>
          {order.supplier_contact && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{order.supplier_contact}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <div className="doc-info-row">
              <span className="doc-info-label">เงื่อนไขชำระ:</span>
              <span className="doc-info-value">{order.payment_terms || '-'}</span>
            </div>
            <div className="doc-info-row">
              <span className="doc-info-label">วิธีชำระ:</span>
              <span className="doc-info-value">{PAYMENT_LABEL[order.payment_method] || order.payment_method || '-'}</span>
            </div>
            <div className="doc-info-row">
              <span className="doc-info-label">วันเครดิต:</span>
              <span className="doc-info-value">{order.credit_days != null ? `${order.credit_days} วัน` : '-'}</span>
            </div>
          </div>
        </div>

        {/* ขวา: ข้อมูลเอกสาร */}
        <div className="doc-info-box">
          <div className="doc-info-row">
            <span className="doc-info-label">เลขที่:</span>
            <span className="doc-info-value" style={{ fontWeight: 700 }}>{order.po_number || '-'}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">วันที่:</span>
            <span className="doc-info-value">{formatThaiDate(order.order_date)}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">กำหนดส่ง:</span>
            <span className="doc-info-value">{order.delivery_date ? formatThaiDate(order.delivery_date) : '-'}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">สถานะ:</span>
            <span className="doc-info-value">{STATUS_LABEL[order.order_status] || order.order_status || '-'}</span>
          </div>
          {order.received_date && (
            <div className="doc-info-row">
              <span className="doc-info-label">รับสินค้าวันที่:</span>
              <span className="doc-info-value">{formatThaiDate(order.received_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ======= ITEMS TABLE ======= */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>ลำดับ</th>
            <th>รายการ</th>
            <th style={{ width: '10%' }}>หน่วย</th>
            <th style={{ width: '10%' }}>จำนวน</th>
            <th style={{ width: '16%' }}>ราคา/หน่วย (บาท)</th>
            <th style={{ width: '16%' }}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const amount = Number(it.quantity || 0) * Number(it.unit_cost || 0);
            return (
              <tr key={it.order_item_id || idx}>
                <td className="center">{idx + 1}</td>
                <td>{it.ingredient_name || it.ingredient_id}</td>
                <td className="center">{it.unit || '-'}</td>
                <td className="center">{it.quantity}</td>
                <td className="right">{thaiNumber(it.unit_cost)}</td>
                <td className="right">{thaiNumber(amount)}</td>
              </tr>
            );
          })}
          {items.length < 5 &&
            Array.from({ length: 5 - items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="center" style={{ color: '#ccc' }}>{items.length + i + 1}</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {/* ======= SUMMARY + NOTES ======= */}
      <div style={{ display: 'flex', gap: '4mm', marginBottom: '4mm', alignItems: 'flex-start' }}>
        {/* Notes */}
        <div style={{ flex: 1 }}>
          <div className="doc-notes">
            <div className="doc-notes-label">หมายเหตุ:</div>
            <div className="doc-notes-box">{order.notes || ''}</div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="doc-summary-box">
          <div className="doc-summary-row">
            <span>รวมเงิน:</span>
            <span>{thaiNumber(subtotal)} บาท</span>
          </div>
          <div className="doc-summary-row">
            <span>ภาษีมูลค่าเพิ่ม {taxRate}%:</span>
            <span>{thaiNumber(taxAmount)} บาท</span>
          </div>
          <div className="doc-summary-row" style={{ fontWeight: 700, fontSize: 14 }}>
            <span>จำนวนเงินทั้งสิ้น:</span>
            <span>{thaiNumber(totalAmount)} บาท</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="doc-amount-words">
        <span style={{ fontWeight: 700 }}>จำนวนเงินเป็นตัวอักษร: </span>
        {bahtToText(totalAmount)}
      </div>

      {/* ======= SIGNATURES ======= */}
      <div className="doc-signatures">
        <div className="doc-sig-col">
          <div className="doc-sig-line" />
          <div>ผู้สั่งซื้อ / Ordered by</div>
          <div className="doc-sig-name">(                                    )</div>
          <div className="doc-sig-date">วันที่ ............../............../............</div>
        </div>
        <div className="doc-sig-col">
          <div className="doc-sig-line" />
          <div>ผู้อนุมัติ / Approved by</div>
          <div className="doc-sig-name">(                                    )</div>
          <div className="doc-sig-date">วันที่ ............../............../............</div>
        </div>
        <div className="doc-sig-col">
          <div className="doc-sig-line" />
          <div>ผู้ตรวจรับ / Received by</div>
          <div className="doc-sig-name">(                                    )</div>
          <div className="doc-sig-date">วันที่ ............../............../............</div>
        </div>
      </div>
    </div>
  );
}
