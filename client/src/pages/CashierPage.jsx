import { useEffect, useState } from "react";
import api from "../db/api";
import { io } from "socket.io-client";
import CashierDashboard from "./CashierDashboard";
import "./CashierPage.css";

export default function CashierPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [currentRound, setCurrentRound] = useState(null);
  const [isRoundOpen, setIsRoundOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // "current" | "history"
  const [historyRounds, setHistoryRounds] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  const [openingCash, setOpeningCash] = useState("");
  
  // Create socket connection reference
  const [socket, setSocket] = useState(null);
  
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    cashSales: 0,
    creditCardSales: 0,
    qrSales: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    // Determine backend URL from API (removing /api path if exists, default to localhost)
    const backendUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:3000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    loadCurrentRound();
  }, []);

  useEffect(() => {
    if (!isRoundOpen || !currentRound || !socket) return;

    // Optional legacy update
    loadSalesSummary(currentRound.opened_at);

    const onNewSale = (saleData) => {
      console.log("WebSocket new-sale received", saleData);
      loadSalesSummary(currentRound.opened_at);
      // CashierDashboard handles its own data fetching, but we can update our local summary
    };

    socket.on('new-sale', onNewSale);

    return () => {
      socket.off('new-sale', onNewSale);
    };
  }, [isRoundOpen, currentRound, socket]);

  const loadCurrentRound = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/sales-round/current");
      
      if (res.data) {
        setCurrentRound(res.data);
        setIsRoundOpen(true);
        await loadSalesSummary(res.data.opened_at);
      } else {
        setIsRoundOpen(false);
        setCurrentRound(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryRounds = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/sales-round");
      setHistoryRounds(res.data);
    } catch (e) {
      console.error("Failed to load history rounds", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistoryRounds();
    }
  }, [activeTab]);

  const loadSalesSummary = async (startDate) => {
    try {
      const res = await api.get("/sales");
      const sales = Array.isArray(res.data) ? res.data : [];
      
      let todaySales = [];
      
      if (currentRound && currentRound.round_id) {
        todaySales = sales.filter((sale) => {
          return sale.round_id === currentRound.round_id;
        });
      }

      const summary = {
        totalSales: 0,
        cashSales: 0,
        creditCardSales: 0,
        qrSales: 0,
        totalTransactions: todaySales.length,
      };

      todaySales.forEach((sale) => {
        const amount = Number(sale.net_total || 0);
        summary.totalSales += amount;

        switch (sale.payment_method) {
          case "Cash":
            summary.cashSales += amount;
            break;
          case "Credit Card":
            summary.creditCardSales += amount;
            break;
          case "QR":
            summary.qrSales += amount;
            break;
        }
      });

      setSalesSummary(summary);
    } catch (e) {
      console.error("Failed to load sales summary:", e);
    }
  };

  const handleOpenRound = async () => {
    setError("");
    setSuccess("");

    if (!openingCash || openingCash === "") {
      setError("กรุณากรอกจำนวนเงินสดเริ่มต้น");
      return;
    }

    if (Number(openingCash) < 0) {
      setError("จำนวนเงินสดต้องมากกว่าหรือเท่ากับ 0");
      return;
    }

    try {
      const res = await api.post("/sales-round/open", {
        opening_cash: Number(openingCash),
      });

      const round = res.data;

      setCurrentRound(round);
      setIsRoundOpen(true);
      setShowOpenModal(false);
      setOpeningCash("");
      setSuccess("เปิดรอบการขายสำเร็จ");
      
      await loadSalesSummary(round.opened_at);
    } catch (e) {
      setError(e?.response?.data?.message || "เปิดรอบการขายไม่สำเร็จ");
    }
  };

  const handleCloseRound = async () => {
    setError("");
    setSuccess("");

    if (!currentRound) {
      setError("ไม่พบรอบการขายที่เปิดอยู่");
      return;
    }

    try {
      await api.put(`/sales-round/${currentRound.round_id}/close`, {
        closing_cash: expectedCash,
        notes: null,
      });
      
      setIsRoundOpen(false);
      setCurrentRound(null);
      setShowCloseModal(false);
      setSuccess("ปิดรอบการขายสำเร็จ");
      
      setSalesSummary({
        totalSales: 0,
        cashSales: 0,
        creditCardSales: 0,
        qrSales: 0,
        totalTransactions: 0,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "ปิดรอบการขายไม่สำเร็จ");
    }
  };

  const formatCurrency = (amount) => {
    return `฿${Number(amount).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  const expectedCash = currentRound
    ? Number(currentRound.opening_cash) + salesSummary.cashSales
    : 0;

  if (loading) {
    return <div className="cashier-page">กำลังโหลด...</div>;
  }

  return (
    <div className="cashier-page">
      <div className="cashier-header">
        <h1 className="cashier-title">แคชเชียร์ (Cashier)</h1>
        <div className="cashier-tabs">
          <button 
            className={`cashier-tab-btn ${activeTab === "current" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("current");
              setSelectedHistoryRound(null);
            }}
          >
            รอบปัจจุบัน
          </button>
          <button 
            className={`cashier-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              setSelectedHistoryRound(null);
            }}
          >
            ประวัติรอบการขาย
          </button>
        </div>
        <div className="cashier-actions">
          {activeTab === "current" && (
            !isRoundOpen ? (
              <button
                className="cashier-btn primary"
                onClick={() => setShowOpenModal(true)}
              >
                เปิดรอบการขาย
              </button>
            ) : (
              <button
                className="cashier-btn success"
                onClick={() => setShowCloseModal(true)}
              >
                ปิดยอด
              </button>
            )
          )}
        </div>
      </div>

      {error && <div className="cashier-error">{error}</div>}
      {success && <div className="cashier-success">{success}</div>}

      {activeTab === "current" ? (
        <>
          <div className="cashier-status-card">
        <span className={`status-badge ${isRoundOpen ? "open" : "closed"}`}>
          {isRoundOpen ? "🟢 รอบการขายเปิดอยู่" : "🔴 รอบการขายปิด"}
        </span>

        {isRoundOpen && currentRound ? (
          <div className="status-info">
            <div className="info-item">
              <div className="info-label">เงินสดเริ่มต้น</div>
              <div className="info-value">
                {formatCurrency(currentRound.opening_cash)}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">เวลาเปิดรอบ</div>
              <div className="info-value">
                {formatDateTime(currentRound.opened_at)}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">ยอดขายรวม</div>
              <div className="info-value highlight">
                {formatCurrency(salesSummary.totalSales)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "#9EA3AE", marginTop: 12 }}>
            กรุณาเปิดรอบการขายเพื่อเริ่มต้นการทำงาน
          </p>
        )}
      </div>

      {isRoundOpen && currentRound && (
        <CashierDashboard roundId={currentRound.round_id} roundInfo={currentRound} />
      )}
      </>
      ) : selectedHistoryRound ? (
        <div className="cashier-history-view">
          <button 
            onClick={() => setSelectedHistoryRound(null)}
            style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            ← กลับไปหน้ารวมประวัติ
          </button>
          <div className="cashier-status-card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>ประวัติรอบเวลา: {formatDateTime(selectedHistoryRound.opened_at)}</h2>
            <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
              <div><strong>ผู้เปิด:</strong> {selectedHistoryRound.opened_by_username}</div>
              <div><strong>เงินสดเริ่มต้น:</strong> {formatCurrency(selectedHistoryRound.opening_cash)}</div>
              <div><strong>เงินทอน/ปิดลิ้นชักที่ระบุไว้:</strong> {selectedHistoryRound.closing_cash !== null ? formatCurrency(selectedHistoryRound.closing_cash) : '-'}</div>
            </div>
          </div>
          <CashierDashboard roundId={selectedHistoryRound.round_id} roundInfo={selectedHistoryRound} />
        </div>
      ) : (
        <div className="cashier-history-card">
          <h2 className="summary-title" style={{ marginBottom: 16 }}>ประวัติรอบการขายทั้งหมด</h2>
          {loadingHistory ? (
            <div>กำลังโหลดข้อมูล...</div>
          ) : historyRounds.length === 0 ? (
            <div style={{ color: "#9EA3AE", textAlign: "center", padding: "40px 0" }}>
              ยังไม่มีประวัติรอบการขาย
            </div>
          ) : (
            <div className="table-container">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>เวลาเปิดรอบ</th>
                    <th>เวลาปิดรอบ</th>
                    <th>ผู้เปิด / ผู้ปิด</th>
                    <th>เงินสดเริ่มต้น</th>
                    <th>ยอดขายรวม</th>
                    <th style={{ textAlign: "right" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRounds.map((hr) => (
                    <tr 
                      key={hr.round_id} 
                      onClick={() => setSelectedHistoryRound(hr)}
                      style={{ cursor: 'pointer' }}
                      className="history-row"
                    >
                      <td>{formatDateTime(hr.opened_at)}</td>
                      <td>{hr.closed_at ? formatDateTime(hr.closed_at) : "-"}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <strong>เปิด:</strong> {hr.opened_by_username || "-"}
                        </div>
                        <div style={{ fontSize: 13, color: "#666" }}>
                          <strong>ปิด:</strong> {hr.closed_by_username || "-"}
                        </div>
                      </td>
                      <td>{formatCurrency(hr.opening_cash)}</td>
                      <td style={{ fontWeight: 600, color: "var(--primary-green)" }}>
                        {formatCurrency(hr.total_sales || 0)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`status-badge ${hr.status === "open" ? "open" : "closed"}`} style={{ padding: "4px 8px", fontSize: 12 }}>
                          {hr.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showOpenModal && (
        <div className="cashier-modal-backdrop">
          <div className="cashier-modal-card">
            <button
              className="cashier-modal-x"
              onClick={() => {
                setShowOpenModal(false);
                setError("");
                setOpeningCash("");
              }}
            >
              ×
            </button>

            <h2 className="cashier-modal-title">เปิดรอบการขาย</h2>
            <p className="cashier-modal-subtitle">
              กรุณากรอกจำนวนเงินสดที่มีในลิ้นชักเงินสดตอนเริ่มต้นวัน
            </p>

            {error && <div className="cashier-error">{error}</div>}

            <div className="cashier-input-group">
              <label>จำนวนเงินสดเริ่มต้น (บาท)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="เช่น 5000.00"
                autoFocus
              />
            </div>

            <div className="cashier-modal-actions">
              <button
                className="cashier-btn"
                onClick={() => {
                  setShowOpenModal(false);
                  setError("");
                  setOpeningCash("");
                }}
              >
                ยกเลิก
              </button>
              <button className="cashier-btn primary" onClick={handleOpenRound}>
                เปิดรอบการขาย
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="cashier-modal-backdrop">
          <div className="cashier-modal-card wide">
            <button
              className="cashier-modal-x"
              onClick={() => {
                setShowCloseModal(false);
                setError("");
              }}
            >
              ×
            </button>

            <h2 className="cashier-modal-title">ปิดยอดรอบการขาย</h2>
            <p className="cashier-modal-subtitle">
              สรุปยอดขายประจำวัน - กรุณาตรวจสอบความถูกต้องก่อนปิดรอบ
            </p>

            {error && <div className="cashier-error">{error}</div>}

            <div className="payment-breakdown">
              <div className="payment-breakdown-title">รายละเอียดยอดขาย</div>
              
              <div className="payment-item">
                <span className="payment-item-label">เงินสดเริ่มต้น</span>
                <span className="payment-item-value">
                  {formatCurrency(currentRound?.opening_cash || 0)}
                </span>
              </div>

              <div className="payment-item">
                <span className="payment-item-label">ยอดขายเงินสด</span>
                <span className="payment-item-value">
                  {formatCurrency(salesSummary.cashSales)}
                </span>
              </div>

              <div className="payment-item">
                <span className="payment-item-label">ยอดขายบัตรเครดิต</span>
                <span className="payment-item-value">
                  {formatCurrency(salesSummary.creditCardSales)}
                </span>
              </div>

              <div className="payment-item">
                <span className="payment-item-label">ยอดขาย QR Code</span>
                <span className="payment-item-value">
                  {formatCurrency(salesSummary.qrSales)}
                </span>
              </div>

              <div className="payment-item" style={{ background: "#FDF0EC", marginTop: 12 }}>
                <span className="payment-item-label" style={{ color: "var(--primary-orange)" }}>
                  <strong>เงินสดที่ควรมีในลิ้นชัก</strong>
                </span>
                <span className="payment-item-value" style={{ color: "var(--primary-orange)" }}>
                  <strong>{formatCurrency(expectedCash)}</strong>
                </span>
              </div>

              <div className="payment-item" style={{ background: "#E8F5E9", marginTop: 8 }}>
                <span className="payment-item-label" style={{ color: "var(--primary-green)" }}>
                  <strong>ยอดขายรวมทั้งหมด</strong>
                </span>
                <span className="payment-item-value" style={{ color: "var(--primary-green)" }}>
                  <strong>{formatCurrency(salesSummary.totalSales)}</strong>
                </span>
              </div>

              <div className="payment-item">
                <span className="payment-item-label">จำนวนธุรกรรม</span>
                <span className="payment-item-value">
                  {salesSummary.totalTransactions} รายการ
                </span>
              </div>
            </div>

            <div className="cashier-modal-actions">
              <button
                className="cashier-btn"
                onClick={() => {
                  setShowCloseModal(false);
                  setError("");
                }}
              >
                ยกเลิก
              </button>
              <button className="cashier-btn success" onClick={handleCloseRound}>
                ยืนยันปิดรอบการขาย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
