import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './print.css';

/**
 * PrintModal — แสดง preview เอกสาร + ปุ่มพิมพ์
 * ใช้ React Portal เพื่อ mount ที่ #print-portal (ชิด body)
 * CSS @media print จะซ่อนทุกอย่างนอกจาก #print-portal
 */
export default function PrintModal({ children, onClose, title = 'เอกสาร' }) {
  const portalRef = useRef(null);

  // ล็อก scroll และสร้าง portal container
  useEffect(() => {
    let el = document.getElementById('print-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'print-portal';
      document.body.appendChild(el);
    }
    portalRef.current = el;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handlePrint = () => window.print();

  const modalContent = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'auto', padding: '20px 0',
      }}
    >
      {/* Toolbar — hidden during print */}
      <div
        className="print-no-print"
        style={{
          position: 'sticky', top: 0, zIndex: 1, width: '210mm', maxWidth: '95vw',
          background: '#1e293b', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: '8px 8px 0 0', boxSizing: 'border-box',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              background: '#22c55e', color: '#fff', border: 'none',
              padding: '7px 20px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            }}
          >
            พิมพ์
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444', color: '#fff', border: 'none',
              padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14,
            }}
          >
            ปิด
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div
        className="print-document"
        style={{
          background: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          width: '210mm', maxWidth: '95vw',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );

  // Mount ผ่าน portal เพื่อให้ @media print จับ #print-portal ได้
  if (!portalRef.current) {
    let el = document.getElementById('print-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'print-portal';
      document.body.appendChild(el);
    }
    portalRef.current = el;
  }

  return createPortal(modalContent, portalRef.current);
}
