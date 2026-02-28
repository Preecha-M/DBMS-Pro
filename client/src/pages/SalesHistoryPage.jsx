import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./SalesHistoryPage.css"; // ⭐ CSS เฉพาะหน้านี้

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("day"); // day | month | year | custom
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

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

  return (
    <div className="pos-page sales-history-page">
      <div className="page-pad">
        {/* Page title */}
        <h2 style={{ marginBottom: 16 }}>{t('salesHistory.title')}</h2>

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
            className={`filter-pill ${mode === "day" ? "active" : ""}`}
            onClick={() => setMode("day")}
          >
            {t('salesHistory.daily')}
          </button>

          {mode === "day" && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          )}

          <button
            className={`filter-pill ${mode === "month" ? "active" : ""}`}
            onClick={() => setMode("month")}
          >
            {t('salesHistory.thisMonth')}
          </button>

          <button
            className={`filter-pill ${mode === "year" ? "active" : ""}`}
            onClick={() => setMode("year")}
          >
            {t('salesHistory.thisYear')}
          </button>

          <button
            className={`filter-pill ${mode === "custom" ? "active" : ""}`}
            onClick={() => setMode("custom")}
          >
            {t('salesHistory.selectMonth')}
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
            {t('salesHistory.loading')}
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
              <div style={{ fontWeight: 600 }}>{t('salesHistory.pastSalesList')}</div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {t('salesHistory.totalItems', { count: sales.length })}
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
                {t('salesHistory.noSalesData')}
              </div>
            ) : (
              <div className="table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>{t('salesHistory.receipt')}</th>
                      <th>{t('salesHistory.date')}</th>
                      <th>{t('salesHistory.member')}</th>
                      <th>{t('salesHistory.employee')}</th>
                      <th>{t('salesHistory.payment')}</th>
                      <th className="col-right">{t('salesHistory.netTotal')}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.map((s, index) => (
                      <tr key={s.sale_id}>
                        <td>{s.receipt_number || s.sale_id}</td>

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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
