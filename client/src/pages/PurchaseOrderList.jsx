import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReceive = async (orderId, itemsToReceive) => {
    try {
      await api.post(`/orders/${orderId}/receive`, { itemsToReceive });
      fetchOrders();
    } catch (error) {
      console.error("Error receiving PO:", error);
      alert("Failed to receive items.");
    }
  };

  if (loading) return <div className="page-pad">Loading Purchase Orders...</div>;

  return (
    <div className="page-pad" style={{ padding: "20px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>Purchase Orders (ใบสั่งซื้อ)</h2>
        <button 
          onClick={() => navigate("/purchase-orders/new")}
          style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Create New PO
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "12px" }}>PO Number</th>
            <th style={{ padding: "12px" }}>Date</th>
            <th style={{ padding: "12px" }}>Supplier</th>
            <th style={{ padding: "12px" }}>Total Amount</th>
            <th style={{ padding: "12px" }}>Status</th>
            <th style={{ padding: "12px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => (
            <tr key={po.order_id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px" }}>{po.po_number || `PO-${po.order_id}`}</td>
              <td style={{ padding: "12px" }}>{po.order_date ? new Date(po.order_date).toLocaleDateString("th-TH") : "-"}</td>
              <td style={{ padding: "12px" }}>{po.supplier?.supplier_name || "-"}</td>
              <td style={{ padding: "12px" }}>{Number(po.total_amount).toLocaleString("th-TH", { style: "currency", currency: "THB" })}</td>
              <td style={{ padding: "12px" }}>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "12px", 
                  fontSize: "12px",
                  background: po.order_status === "Received" ? "#e8f5e9" : po.order_status === "Pending" ? "#fff3e0" : "#e0f7fa",
                  color: po.order_status === "Received" ? "#2e7d32" : po.order_status === "Pending" ? "#ef6c00" : "#006064"
                }}>
                  {po.order_status}
                </span>
              </td>
              <td style={{ padding: "12px" }}>
                {po.order_status !== "Received" && (
                  <button 
                    onClick={() => {
                        const itemsToReceive = po.items?.filter(it => (it.quantity || 0) > (it.received_quantity || 0)).map(it => ({
                            order_item_id: it.order_item_id,
                            received_quantity: (it.quantity || 0) - (it.received_quantity || 0)
                        }));
                        if(window.confirm('Receive remaining items for this PO into Inventory?')) {
                            handleReceive(po.order_id, itemsToReceive);
                        }
                    }}
                    style={{ padding: "6px 12px", background: "#2196f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "8px" }}
                  >
                    Receive Items
                  </button>
                )}
                {po.document_url && (
                  <a href={po.document_url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: "#607d8b", color: "#fff", textDecoration: "none", borderRadius: "4px", fontSize: "13px" }}>
                    View Doc
                  </a>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#666" }}>No Purchase Orders Found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
