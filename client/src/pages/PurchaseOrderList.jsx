import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../db/api";
import PrintModal from "../components/print/PrintModal";
import PurchaseOrderDocument from "../components/print/PurchaseOrderDocument";
import { blockInvalidNumKey, sanitizeNumberInput } from "../utils/bahtToText";

const STATUS_BADGE = {
  Received: { bg: '#d4edda', color: '#155724', label: 'รับแล้ว' },
  Pending:  { bg: '#fff3cd', color: '#856404', label: 'รอดำเนินการ' },
  Partial:  { bg: '#dbeafe', color: '#1e40af', label: 'รับบางส่วน' },
  Cancelled:{ bg: '#fee2e2', color: '#b91c1c', label: 'ยกเลิก' },
};

const getBadge = (status) => STATUS_BADGE[status] || { bg: '#f3f4f6', color: '#374151', label: status };

const thb = (n) =>
  Number(n || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printOrder, setPrintOrder] = useState(null);

  // Receive modal state
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receiveList, setReceiveList] = useState([]);
  const [goodsReceiptFile, setGoodsReceiptFile] = useState(null);
  const [taxInvoiceFile, setTaxInvoiceFile] = useState(null);
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState("");

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const openReceiveModal = (po) => {
    const itemsToProcess = po.items
      ?.filter(it => (it.quantity || 0) > (it.received_quantity || 0))
      .map(it => ({
        order_item_id: it.order_item_id,
        item_name: it.ingredient_name || `Item ${it.ingredient_id}`,
        unit: it.unit || '',
        max_qty: (it.quantity || 0) - (it.received_quantity || 0),
        received_quantity: (it.quantity || 0) - (it.received_quantity || 0),
        expire_date: "",
      }));
    setReceiveList(itemsToProcess || []);
    setReceivingOrder(po);
    setGoodsReceiptFile(null);
    setTaxInvoiceFile(null);
    setReceiveError("");
  };

  const closeReceiveModal = () => { setReceivingOrder(null); setReceiveList([]); };

  const updateReceiveItem = (idx, field, value) => {
    const newList = [...receiveList];
    newList[idx][field] = value;
    setReceiveList(newList);
  };

  const submitReceive = async (e) => {
    e.preventDefault();
    setSubmittingReceive(true);
    setReceiveError("");

    try {
      let goods_receipt_url = null;
      let tax_invoice_url = null;

      if (goodsReceiptFile) {
        const fd = new FormData();
        fd.append("file", goodsReceiptFile);
        const res = await api.post("/upload/po-document", fd, { headers: { "Content-Type": "multipart/form-data" } });
        goods_receipt_url = res.data.url;
      }
      if (taxInvoiceFile) {
        const fd = new FormData();
        fd.append("file", taxInvoiceFile);
        const res = await api.post("/upload/po-document", fd, { headers: { "Content-Type": "multipart/form-data" } });
        tax_invoice_url = res.data.url;
      }

      await api.post(`/orders/${receivingOrder.order_id}/receive`, {
        itemsToReceive: receiveList.map(it => ({
          order_item_id: it.order_item_id,
          received_quantity: Number(it.received_quantity),
          expire_date: it.expire_date || undefined,
        })),
        goods_receipt_url,
        tax_invoice_url,
      });

      closeReceiveModal();
      fetchOrders();
    } catch (error) {
      setReceiveError(error?.response?.data?.message || "เกิดข้อผิดพลาดในการรับสินค้า");
    } finally {
      setSubmittingReceive(false);
    }
  };

  if (loading) return <div className="page-pad">กำลังโหลด...</div>;

  return (
    <div className="page-pad" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>ใบสั่งซื้อ (Purchase Orders)</h2>
        <button
          onClick={() => navigate("/purchase-orders/new")}
          className="pos-neworder-btn"
        >
          + สร้างใบสั่งซื้อใหม่
        </button>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #e5e7eb" }}>
                {["เลขที่ใบสั่งซื้อ", "วันที่สั่ง", "ซัพพลายเออร์", "ยอดรวม (บาท)", "สถานะ", "จัดการ"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const badge = getBadge(po.order_status);
                const total = po.total_amount != null
                  ? Number(po.total_amount)
                  : (po.items || []).reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_cost || 0), 0);
                return (
                  <tr key={po.order_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: '#1976d2' }}>
                      {po.po_number || `PO-${po.order_id}`}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {po.order_date ? new Date(po.order_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{po.supplier_name || "-"}</td>
                    <td style={{ padding: "12px 14px", textAlign: 'right', fontWeight: 600 }}>
                      {total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* ปุ่มพิมพ์ใบสั่งซื้อ */}
                        <button
                          onClick={() => setPrintOrder(po)}
                          style={{ padding: "5px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontFamily: 'inherit' }}
                        >
                          🖨 พิมพ์ PO
                        </button>

                        {/* รับสินค้า */}
                        {po.order_status !== "Received" && po.order_status !== "Cancelled" && (
                          <button
                            onClick={() => openReceiveModal(po)}
                            style={{ padding: "5px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontFamily: 'inherit' }}
                          >
                            รับสินค้า
                          </button>
                        )}

                        {/* เอกสารแนบ */}
                        {po.document_url && (
                          <a href={po.document_url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "5px 10px", background: "#607d8b", color: "#fff", textDecoration: "none", borderRadius: 4, fontSize: 12 }}>
                            เอกสาร PO
                          </a>
                        )}
                        {po.goods_receipt_url && (
                          <a href={po.goods_receipt_url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "5px 10px", background: "#795548", color: "#fff", textDecoration: "none", borderRadius: 4, fontSize: 12 }}>
                            ใบรับสินค้า
                          </a>
                        )}
                        {po.tax_invoice_url && (
                          <a href={po.tax_invoice_url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "5px 10px", background: "#9c27b0", color: "#fff", textDecoration: "none", borderRadius: 4, fontSize: 12 }}>
                            ใบกำกับภาษี
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>
                    ไม่พบข้อมูลใบสั่งซื้อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= RECEIVE MODAL ======= */}
      {receivingOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "28px", borderRadius: 10, width: "90%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>รับสินค้าเข้าสต๊อก</h3>
            <p style={{ margin: "0 0 16px 0", color: '#6b7280', fontSize: 14 }}>
              ใบสั่งซื้อ: <strong>{receivingOrder.po_number}</strong> — {receivingOrder.supplier_name || '-'}
            </p>

            {receiveError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 14 }}>
                {receiveError}
              </div>
            )}

            <form onSubmit={submitReceive}>
              {/* อัปโหลดเอกสาร */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ใบรับสินค้า (ไฟล์แนบ)</label>
                  <input type="file" accept="image/*,application/pdf"
                    onChange={(e) => setGoodsReceiptFile(e.target.files[0])}
                    className="form-file-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ใบกำกับภาษี (ไฟล์แนบ)</label>
                  <input type="file" accept="image/*,application/pdf"
                    onChange={(e) => setTaxInvoiceFile(e.target.files[0])}
                    className="form-file-input" />
                </div>
              </div>

              {/* ตารางรายการ */}
              <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>รายการสินค้าที่จะรับ</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #e5e7eb" }}>รายการ</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #e5e7eb", width: 120 }}>จำนวนที่รับ</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #e5e7eb", width: 140 }}>วันหมดอายุ</th>
                  </tr>
                </thead>
                <tbody>
                  {receiveList.map((item, idx) => (
                    <tr key={item.order_item_id}>
                      <td style={{ padding: "8px 10px", border: "1px solid #e5e7eb" }}>
                        {item.item_name}
                        <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 4 }}>
                          (สูงสุด {item.max_qty} {item.unit})
                        </span>
                      </td>
                      <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb" }}>
                        <input type="number" min="0" max={item.max_qty} value={item.received_quantity}
                          onChange={(e) => updateReceiveItem(idx, "received_quantity", sanitizeNumberInput(e.target.value, false))}
                          onKeyDown={blockInvalidNumKey}
                          className="form-number-input" style={{ textAlign: 'right' }} />
                      </td>
                      <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb" }}>
                        <input type="date" value={item.expire_date}
                          onChange={(e) => updateReceiveItem(idx, "expire_date", e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))}
                  {receiveList.length === 0 && (
                    <tr><td colSpan="3" style={{ padding: 16, textAlign: "center", color: '#9ca3af' }}>รับสินค้าครบทุกรายการแล้ว</td></tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={closeReceiveModal}
                  style={{ padding: "9px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontFamily: 'inherit', fontSize: 14 }}>
                  ยกเลิก
                </button>
                <button type="submit" disabled={submittingReceive || receiveList.length === 0}
                  style={{ padding: "9px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, cursor: submittingReceive ? "not-allowed" : "pointer", fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
                  {submittingReceive ? "กำลังบันทึก..." : "ยืนยันรับสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======= PRINT MODAL ======= */}
      {printOrder && (
        <PrintModal
          title={`ใบสั่งซื้อ — ${printOrder.po_number || ''}`}
          onClose={() => setPrintOrder(null)}
        >
          <PurchaseOrderDocument order={printOrder} />
        </PrintModal>
      )}
    </div>
  );
}
