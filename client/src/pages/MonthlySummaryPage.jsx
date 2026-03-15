import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./MonthlySummaryPage.css";

const MONTHS = [
  { value: 1, labelTh: "ม.ค.", labelEn: "Jan" },
  { value: 2, labelTh: "ก.พ.", labelEn: "Feb" },
  { value: 3, labelTh: "มี.ค.", labelEn: "Mar" },
  { value: 4, labelTh: "เม.ย.", labelEn: "Apr" },
  { value: 5, labelTh: "พ.ค.", labelEn: "May" },
  { value: 6, labelTh: "มิ.ย.", labelEn: "Jun" },
  { value: 7, labelTh: "ก.ค.", labelEn: "Jul" },
  { value: 8, labelTh: "ส.ค.", labelEn: "Aug" },
  { value: 9, labelTh: "ก.ย.", labelEn: "Sep" },
  { value: 10, labelTh: "ต.ค.", labelEn: "Oct" },
  { value: 11, labelTh: "พ.ย.", labelEn: "Nov" },
  { value: 12, labelTh: "ธ.ค.", labelEn: "Dec" },
];

export default function MonthlySummaryPage() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/reports/monthly-summary", {
        params: { year, month },
      });
      setData(res.data);
    } catch (e) {
      setData(null);
      setError(e?.response?.data?.message || t("monthlySummary.errLoad", "Failed to load summary"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const formatCurrency = (amt) =>
    `฿${Number(amt).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isThai = i18n.language === "th";

  return (
    <div className="page-pad monthly-summary-page">
      <div className="monthly-summary-header">
        <h2 style={{ margin: 0 }}>{t("monthlySummary.pageTitle", "สรุปรายได้และค่าใช้จ่ายต่อเดือน")}</h2>
        <div className="monthly-summary-filters">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="summary-select"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {isThai ? m.labelTh : m.labelEn} ({m.value})
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="summary-select"
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="summary-loading">{t("common.loading", "Loading...")}</div>
      ) : data ? (
        <div className="summary-cards">
          <div className="summary-card revenue">
            <div className="summary-card-label">{t("monthlySummary.revenue", "รายได้ (ยอดขาย)")}</div>
            <div className="summary-card-value">{formatCurrency(data.revenue)}</div>
          </div>

          <div className="summary-card expense-section">
            <div className="summary-card-label">{t("monthlySummary.expenses", "ค่าใช้จ่าย")}</div>
            <div className="summary-card-detail">
              <span>{t("monthlySummary.expensePurchase", "สั่งของ/ซื้อสินค้า")}</span>
              <span>{formatCurrency(data.expensePurchase)}</span>
            </div>
            <div className="summary-card-detail">
              <span>{t("monthlySummary.expenseSalary", "เงินเดือนพนักงาน")}</span>
              <span>{formatCurrency(data.expenseSalary)}</span>
            </div>
            <div className="summary-card-total">
              <span>{t("monthlySummary.totalExpense", "รวมค่าใช้จ่าย")}</span>
              <span>{formatCurrency(data.totalExpense)}</span>
            </div>
          </div>

          <div className={`summary-card profit ${data.profit >= 0 ? "positive" : "negative"}`}>
            <div className="summary-card-label">{t("monthlySummary.profit", "กำไร/ขาดทุน")}</div>
            <div className="summary-card-value">{formatCurrency(data.profit)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
