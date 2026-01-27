import { useEffect, useState } from "react";
import api from "../db/api";
import "./SalesHistoryPage.css"; // ⭐ CSS เฉพาะหน้านี้

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("month"); // month | year | custom
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales", {
        params: { mode, month },
      });
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, [mode, month]);

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

  return (
    <div className="pos-page sales-history-page">
      <div className="page-pad">
        {/* Page title */}
        <h2 style={{ marginBottom: 16 }}>Sales History</h2>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            className={`filter-pill ${mode === "month" ? "active" : ""}`}
            onClick={() => setMode("month")}
          >
            เดือนนี้
          </button>

          <button
            className={`filter-pill ${mode === "year" ? "active" : ""}`}
            onClick={() => setMode("year")}
          >
            ทั้งปี
          </button>

          <button
            className={`filter-pill ${mode === "custom" ? "active" : ""}`}
            onClick={() => setMode("custom")}
          >
            เลือกเดือน
          </button>

          {mode === "custom" && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input"
            />
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="card" style={{ padding: 24 }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="card">
            {/* Table header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600 }}>รายการขายย้อนหลัง</div>
              <div style={{ fontSize: 13, color: "#888" }}>
                ทั้งหมด {sales.length} รายการ
              </div>
            </div>

            {/* Table */}
            {sales.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                ไม่พบข้อมูลการขาย
              </div>
            ) : (
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Employee</th>
                    <th>Payment</th>
                    <th className="col-right">Net Total</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((s, index) => (
                    <tr key={s.sale_id}>
                      <td>{s.sale_id}</td>

                      {/* Date */}
                      <td>
                        <div className="date-main">
                          {formatDate(s.sale_datetime)}
                        </div>
                        <div className="date-sub">
                          {formatTime(s.sale_datetime)}
                        </div>
                      </td>

                      <td>{s.member_name || "-"}</td>

                      <td>{s.employee_username}</td>

                      {/* Payment */}
                      <td>
                        <span className="payment-badge">
                          {s.payment_method}
                        </span>
                      </td>

                      {/* Net total */}
                      <td
                        className="col-right"
                        style={{
                          fontWeight: 700,
                          color: "var(--primary-orange)",
                        }}
                      >
                        ฿{Number(s.net_total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
