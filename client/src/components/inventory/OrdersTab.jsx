import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function OrdersTab({ orders }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
        <button className="btn-soft" onClick={() => navigate("/purchase-orders")} style={{ padding: '8px 16px', fontSize: 13 }}>
          {t('inventory.btnViewAllOrders', 'ดูรายละเอียดทั้งหมด')}
        </button>
        <button className="pos-neworder-btn" onClick={() => navigate("/purchase-orders/new")}>
          {t('inventory.btnCreateOrder')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="inv-table">
          <thead>
            <tr>
              <th>{t('inventory.colOrderId')}</th>
              <th>{t('inventory.colOrderDate')}</th>
              <th>{t('inventory.colOrderSupplier')}</th>
              <th>{t('inventory.colOrderPrice', 'ราคา')}</th>
              <th>{t('inventory.colOrderStatus')}</th>
              <th style={{ minWidth: 100 }}>{t('inventory.colOrderAction')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.order_id}>
                <td style={{ fontWeight: 600 }}>{o.po_number || `#${o.order_id}`}</td>
                <td>{o.order_date ? new Date(o.order_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}</td>
                <td>{o.supplier_name || "-"}</td>
                <td>
                  {o.total_amount
                    ? `฿${Number(o.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `฿${(o.items?.reduce((sum, it) => sum + (Number(it.unit_cost || 0) * Number(it.quantity || 0)), 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </td>
                <td>
                  <span className={`inv-badge ${
                    String(o.order_status).toLowerCase() === 'received' ? 'received' :
                    String(o.order_status).toLowerCase() === 'partial' ? 'partial' : 'pending'
                  }`} style={String(o.order_status).toLowerCase() === 'partial' ? { background: '#dbeafe', color: '#1e40af' } : undefined}>
                    {o.order_status}
                  </span>
                </td>
                <td>
                  {String(o.order_status).toLowerCase() !== 'received' && (
                    <button className="btn-soft" onClick={() => navigate("/purchase-orders")} style={{ whiteSpace: 'nowrap', padding: '5px 12px', fontSize: 13 }}>
                      {t('inventory.btnReceiveItem')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>{t('inventory.noOrders')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
