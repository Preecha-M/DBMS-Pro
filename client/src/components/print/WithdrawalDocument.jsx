import { useStoreConfig } from '../../context/StoreConfigContext';
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

const employeeName = (employee) => {
  if (!employee) return '-';
  if (employee.first_name_th) return `${employee.first_name_th} ${employee.last_name_th || ''}`.trim();
  return employee.username || '-';
};

/**
 * ใบเบิกวัตถุดิบ — Material Requisition Form
 * Props:
 *   withdrawal: object จาก API /withdrawals/:id (หรือ /withdrawals list item)
 *     { wd_number, request_date, notes, employee, withdrawal_request_item[] }
 */
export default function WithdrawalDocument({ withdrawal }) {
  const { config: STORE_CONFIG } = useStoreConfig();
  if (!withdrawal) return null;

  const items = withdrawal.withdrawal_request_item || [];

  return (
    <div className="print-doc-page">
      {/* ======= HEADER ======= */}
      <div className="doc-header">
        <p className="doc-store-name">{STORE_CONFIG.name}</p>
        <p className="doc-store-sub">{STORE_CONFIG.address}</p>
        {STORE_CONFIG.taxId !== '-' && (
          <p className="doc-store-sub">เลขประจำตัวผู้เสียภาษี: {STORE_CONFIG.taxId} &nbsp;|&nbsp; โทร: {STORE_CONFIG.phone}</p>
        )}
      </div>

      {/* ======= TITLE ======= */}
      <div className="doc-title">ใบเบิกวัตถุดิบ</div>
      <div className="doc-title-en">MATERIAL REQUISITION FORM</div>

      {/* ======= INFO GRID ======= */}
      <div className="doc-info-grid">
        <div className="doc-info-box">
          <div className="doc-info-row">
            <span className="doc-info-label">ผู้เบิก:</span>
            <span className="doc-info-value">{employeeName(withdrawal.employee)}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">หมายเหตุ:</span>
            <span className="doc-info-value">{withdrawal.notes || '-'}</span>
          </div>
        </div>

        <div className="doc-info-box">
          <div className="doc-info-row">
            <span className="doc-info-label">เลขที่:</span>
            <span className="doc-info-value" style={{ fontWeight: 700 }}>{withdrawal.wd_number || '-'}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">วันที่:</span>
            <span className="doc-info-value">{formatThaiDate(withdrawal.request_date)}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">สถานะ:</span>
            <span className="doc-info-value">{withdrawal.status || 'Completed'}</span>
          </div>
        </div>
      </div>

      {/* ======= ITEMS TABLE ======= */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{ width: '6%' }}>ลำดับ</th>
            <th style={{ width: '16%' }}>รหัสวัตถุดิบ</th>
            <th>ชื่อวัตถุดิบ</th>
            <th style={{ width: '12%' }}>หน่วย</th>
            <th style={{ width: '14%' }}>จำนวนที่เบิก</th>
            <th style={{ width: '18%' }}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.withdrawal_item_id || idx}>
              <td className="center">{idx + 1}</td>
              <td className="center">{it.ingredient_id}</td>
              <td>{it.ingredient?.ingredient_name || it.ingredient_id}</td>
              <td className="center">{it.ingredient?.unit || '-'}</td>
              <td className="center" style={{ fontWeight: 700 }}>{it.quantity}</td>
              <td>-</td>
            </tr>
          ))}
          {/* Empty rows to fill the table if few items */}
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

      {/* ======= NOTES (additional) ======= */}
      <div className="doc-notes">
        <div className="doc-notes-label">หมายเหตุเพิ่มเติม:</div>
        <div className="doc-notes-box">{withdrawal.notes || ''}</div>
      </div>

      {/* ======= SIGNATURES ======= */}
      <div className="doc-signatures">
        <div className="doc-sig-col">
          <div className="doc-sig-line" />
          <div>ผู้เบิก / Requested by</div>
          <div className="doc-sig-name">( {employeeName(withdrawal.employee)} )</div>
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
          <div>ผู้จ่ายวัตถุดิบ / Issued by</div>
          <div className="doc-sig-name">(                                    )</div>
          <div className="doc-sig-date">วันที่ ............../............../............</div>
        </div>
      </div>
    </div>
  );
}
