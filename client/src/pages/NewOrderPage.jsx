import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../db/api";

export default function NewOrderPage() {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);
  const [cats, setCats] = useState([]);
  const [cart, setCart] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [saleInfo, setSaleInfo] = useState(null);
  const [error, setError] = useState("");

  const [step, setStep] = useState("ORDER");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [memberId, setMemberId] = useState("");
  const [memberInfo, setMemberInfo] = useState(null);
  const [orderSnapshot, setOrderSnapshot] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState("");

  const activeCatId = params.get("cat") ? Number(params.get("cat")) : null;

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [mRes, cRes, pRes] = await Promise.all([
        api.get("/menu"),
        api.get("/categories"),
        api.get("/promotions"),
      ]);

      const menuList = Array.isArray(mRes.data) ? mRes.data : [];
      setMenus(
        menuList.filter(
          (m) => String(m.status || "").toLowerCase() !== "unavailable"
        )
      );

      const catList = Array.isArray(cRes.data) ? cRes.data : [];
      setCats(catList);
      
      const promoList = Array.isArray(pRes.data) ? pRes.data : [];
      setPromotions(promoList);
    } catch (e) {
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pillCats = useMemo(
    () => [{ category_id: null, category_name: "All" }, ...cats],
    [cats]
  );

  const visibleMenus = useMemo(() => {
    if (!activeCatId) return menus;
    return menus.filter((m) => Number(m.category_id) === activeCatId);
  }, [menus, activeCatId]);

  const inc = (m) => {
    setCart((prev) => {
      const found = prev.find((x) => x.menu_id === m.menu_id);
      if (!found) return [...prev, { ...m, qty: 1 }];
      return prev.map((x) =>
        x.menu_id === m.menu_id ? { ...x, qty: x.qty + 1 } : x
      );
    });
  };

  const dec = (menu_id) => {
    setCart((prev) => {
      const found = prev.find((x) => x.menu_id === menu_id);
      if (!found) return prev;
      if (found.qty <= 1) return prev.filter((x) => x.menu_id !== menu_id);
      return prev.map((x) =>
        x.menu_id === menu_id ? { ...x, qty: x.qty - 1 } : x
      );
    });
  };

  const subtotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * it.qty, 0),
    [cart]
  );
  const qty = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
  const earnedPoints = useMemo(
    () => cart.reduce((s, it) => s + Number(it.qty || 0), 0),
    [cart]
  );

  const selectedPromo = useMemo(() => {
    if (!selectedPromoId) return null;
    return promotions.find(p => p.promotion_id === Number(selectedPromoId)) || null;
  }, [promotions, selectedPromoId]);

  const discountAmount = useMemo(() => {
    if (!selectedPromo) return 0;
    
    const promoMenuIds = Array.isArray(selectedPromo.menu_ids) ? selectedPromo.menu_ids.map(Number) : [];
    
    let applicableItems = cart;
    if (promoMenuIds.length > 0) {
      applicableItems = cart.filter(it => promoMenuIds.includes(it.menu_id));
    }
    
    const applicableQty = applicableItems.reduce((s, it) => s + it.qty, 0);
    const applicableTotal = applicableItems.reduce((s, it) => s + (Number(it.price || 0) * it.qty), 0);
    
    const minQty = Number(selectedPromo.min_quantity || 1);
    
    if (applicableQty < minQty) return 0; // Does not meet minimum quantity condition
    
    const dType = selectedPromo.discount_type || 'AMOUNT';
    const dValue = Number(selectedPromo.discount_value || 0);
    
    let discount = 0;
    if (dType === 'PERCENTAGE') {
      discount = applicableTotal * (dValue / 100);
    } else {
      discount = dValue;
    }
    
    return Math.min(discount, applicableTotal);
  }, [selectedPromo, cart]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "Cash") return 0;
    const cash = Number(cashReceived || 0);
    const net = subtotal - Number(discountAmount || 0);
    return Math.max(cash - net, 0);
  }, [cashReceived, subtotal, paymentMethod, discountAmount]);

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);

    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(d);
  };

  const invoiceNo = saleInfo?.sale_id
    ? `Invoice No: ${saleInfo.sale_id} ${formatDateTime(
        saleInfo.sale_datetime
      )}`
    : "Invoice No: -";

  const orderNo = saleInfo?.sale_id
    ? `Order: #${saleInfo.sale_id}`
    : "Order: -";

  const checkMember = async () => {
    setMemberInfo(null);
    const phone = memberId.trim();
    if (!phone) return null;

    const res = await api.get(`/members?phone=฿{phone}`);

    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error("Member not found");
    }

    const member = res.data[0];
    setMemberInfo(member);
    return member;
  };

  const goConfirm = async () => {
    setError("");

    if (paymentMethod === "Cash") {
      const net = subtotal - Number(discountAmount || 0);
      if (!cashReceived || cashReceived === "") {
        setError("กรุณากรอกจำนวนเงินสดที่ลูกค้าให้");
        return;
      }
      if (Number(cashReceived) < net) {
        setError(
          `เงินสดไม่พอ! ขาดอีก ${(net - Number(cashReceived)).toFixed(
            2
          )} บาท`
        );
        return;
      }
    }

    try {
      const info = await checkMember();

      const snapshot = {
        items: cart.map((it) => ({
          menu_id: it.menu_id,
          name: it.menu_name,
          qty: it.qty,
          price: Number(it.price || 0),
        })),
        subtotal,
        qty,
        earnedPoints,
        paymentMethod,
        discountAmount: Number(discountAmount || 0),
        selectedPromo,
        memberId: info?.member_id ?? null,
        memberName: info?.name ?? null,
      };

      setOrderSnapshot(snapshot);
      setStep("CONFIRM");
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "ตรวจสอบสมาชิกไม่สำเร็จ"
      );
    }
  };

  const confirmPay = async () => {
    setError("");
    if (!orderSnapshot?.items?.length) return;

    if (paymentMethod === "Cash") {
      const net = orderSnapshot.subtotal - orderSnapshot.discountAmount;
      if (!cashReceived || cashReceived === "") {
        setError("กรุณากรอกจำนวนเงินสดที่ลูกค้าให้");
        return;
      }

      if (Number(cashReceived) < net) {
        setError(
          `เงินสดไม่พอ! ขาดอีก ${(
            net - Number(cashReceived)
          ).toFixed(2)} บาท`
        );
        return;
      }
    }

    try {
      const payload = {
        payment_method: paymentMethod,
        discount_amount: orderSnapshot.discountAmount,
        promotion_id: orderSnapshot.selectedPromo?.promotion_id ?? null,
        member_id: orderSnapshot.memberId,
        cash_received: paymentMethod === "Cash" ? Number(cashReceived) : null,
        items: orderSnapshot.items.map((it) => ({
          menu_id: it.menu_id,
          quantity: it.qty,
        })),
      };

      const res = await api.post("/sales", payload);
      setSaleInfo(res.data);
      setCart([]);
      setStep("RECEIPT");
    } catch (e) {
      setError(e?.response?.data?.message || "บันทึกการขายไม่สำเร็จ");
    }
  };

  const closeAllModals = () => {
    setStep("ORDER");
    setError("");
    setCashReceived("");
    setSelectedPromoId("");
    setSaleInfo(null);
    setOrderSnapshot(null);
  };

  return (
    <div className="pos-page">
      <div className="sub-nav">
        {pillCats.map((c) => (
          <button
            key={String(c.category_id)}
            type="button"
            className={`filter-pill ${
              (!c.category_id && !activeCatId) ||
              Number(c.category_id) === activeCatId
                ? "active"
                : ""
            }`}
            onClick={() => {
              if (!c.category_id) setParams({});
              else setParams({ cat: String(c.category_id) });
            }}
          >
            {c.category_name}
          </button>
        ))}
      </div>

      <div className="pos-order-grid">
        <section className="pos-products">
          {loading ? (
            <div className="page-pad">Loading...</div>
          ) : (
            <div className="product-grid">
              {visibleMenus.map((m) => (
                <div key={m.menu_id} className="product-card">
                  <img
                    src={
                      m.image_url ||
                      "https://cdn-icons-png.flaticon.com/512/924/924514.png"
                    }
                    alt={m.menu_name}
                    className="product-image"
                  />
                  <div className="product-name">{m.menu_name}</div>
                  <div className="product-price">
                    ฿ {Number(m.price || 0).toFixed(2)}
                  </div>

                  <div className="product-actions">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => dec(m.menu_id)}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="qty-add"
                      onClick={() => inc(m)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              {visibleMenus.length === 0 && (
                <div className="page-pad">ไม่มีเมนูในหมวดนี้</div>
              )}
            </div>
          )}
        </section>

        <aside className="cart-panel">
          <div className="cart-head">
            <div className="cart-invoice">{invoiceNo}</div>

            <div className="cart-brand">
              <div className="cart-brand-logo">Ep</div>
              <div>
                <div className="cart-brand-title">CP POS</div>
                <div className="cart-brand-sub">cppos@gmail.com</div>
              </div>
            </div>

            <div className="cart-meta">
              <span className="cart-order">{orderNo}</span>
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: 10 }}>
                {error}
              </div>
            )}
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">ยังไม่มีสินค้าในออเดอร์</div>
            ) : (
              cart.map((it) => (
                <div key={it.menu_id} className="cart-row">
                  <img
                    src={
                      it.image_url ||
                      "https://cdn-icons-png.flaticon.com/512/924/924514.png"
                    }
                    alt={it.menu_name}
                    className="cart-thumb"
                  />
                  <div className="cart-row-mid">
                    <div className="cart-row-name">{it.menu_name}</div>
                    <div className="cart-row-sub">
                      ฿ {Number(it.price || 0).toFixed(2)}
                    </div>

                    <div className="cart-qty">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => dec(it.menu_id)}
                      >
                        -
                      </button>
                      <div className="qty-box">{it.qty}</div>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => inc(it)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-row-right">
                    ฿ {(Number(it.price || 0) * it.qty).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-foot">
            <div className="cart-total">
              <div>
                <div className="cart-total-title">Total</div>
                <div className="cart-total-sub">
                  Items: {cart.length}, Quantity: {qty}
                </div>
              </div>
              <div className="cart-total-money">฿ {subtotal.toFixed(0)}</div>
            </div>

            <button
              className="cart-btn ghost"
              type="button"
              onClick={() => {
                if (!saleInfo && !orderSnapshot) return;
                setStep("RECEIPT");
              }}
            >
              Print Invoice
            </button>

            <button
              className="cart-btn pay"
              type="button"
              onClick={() => {
                setError("");
                if (cart.length === 0) return;
                setStep("PAYMENT");
              }}
            >
              Payments
            </button>
          </div>
        </aside>
      </div>

      {step === "PAYMENT" && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={closeAllModals}>
              ×
            </button>

            <div className="modal-title">Payment</div>

            <div className="input-group">
              <label>หมายเลขสมาชิก (ไม่ใส่ = Walk-in)</label>
              <input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="เช่น 12"
              />
            </div>

            <div className="input-group">
              <label>โปรโมชั่น</label>
              <select
                value={selectedPromoId}
                onChange={(e) => setSelectedPromoId(e.target.value)}
              >
                <option value="">-- ไม่ใช้โปรโมชั่น --</option>
                {promotions.map(p => {
                  const subtext = p.discount_type === 'PERCENTAGE' ? `ลด ${p.discount_value}%` : `ลด ฿${p.discount_value}`;
                  return (
                    <option key={p.promotion_id} value={p.promotion_id}>
                      {p.promotion_name} ({subtext})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedPromo && (
              <div className="modal-note" style={{ marginTop: 8 }}>
                เงื่อนไข: {selectedPromo.discount_type === 'PERCENTAGE' ? `ลด ${Number(selectedPromo.discount_value)}%` : `ลด ${Number(selectedPromo.discount_value)} ฿`} 
                {` | ขั้นต่ำ ${selectedPromo.min_quantity} แก้ว`}
                {selectedPromo.menu_ids?.length > 0 && ` | เฉพาะเมนูที่ร่วมรายการ`}
                <span style={{ display: 'block', color: 'var(--primary-orange)', marginTop: 4 }}>
                  หักส่วนลด: <b>{discountAmount > 0 ? `-${discountAmount.toFixed(2)} บาท` : 'ยังไม่เข้าเงื่อนไข'}</b>
                </span>
              </div>
            )}

            <div className="input-group" style={{ marginTop: 12 }}>
              <label>วิธีชำระเงิน</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="QR">QR</option>
              </select>
            </div>
            {paymentMethod === "Cash" && (
              <div className="input-group">
                <label>เงินสดที่ลูกค้าให้</label>
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="เช่น 500"
                />
                <div className="modal-note">
                  เงินทอน: <b>{changeAmount.toFixed(2)}</b> บาท
                </div>
              </div>
            )}

            <div className="modal-note">
              แต้มที่จะได้รับ: <b>{earnedPoints}</b> คะแนน (1 แก้ว = 1 คะแนน)
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: 10 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-soft" onClick={closeAllModals}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={goConfirm}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "CONFIRM" && orderSnapshot && (
        <div className="modal-backdrop">
          <div className="modal-card wide">
            <button className="modal-x" onClick={closeAllModals}>
              ×
            </button>

            <div className="modal-title center">Order confirmation</div>
            <div className="modal-sub center">
              Please confirm the order below to completed payment
            </div>

            <div className="confirm-table">
              <div className="confirm-head">
                <div>ITEM NAME</div>
                <div>QTY</div>
                <div>PRICE</div>
                <div>SUBTOTAL</div>
              </div>

              {orderSnapshot.items.map((it) => (
                <div className="confirm-row" key={it.menu_id}>
                  <div>{it.name}</div>
                  <div className="center">{it.qty}</div>
                  <div className="right">฿ {it.price.toFixed(2)}</div>
                  <div className="right">
                    ฿ {(it.price * it.qty).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="confirm-sum">
                <div className="muted">Total points</div>
                <div className="right">
                  <b>{orderSnapshot.earnedPoints}</b>
                </div>
              </div>

              {orderSnapshot.discountAmount > 0 && (
                <div className="confirm-sum">
                  <div className="muted">Promotion Discount</div>
                  <div className="right" style={{ color: "var(--primary-orange)" }}>
                    -฿ {orderSnapshot.discountAmount.toFixed(2)}
                  </div>
                </div>
              )}

              <div className="confirm-total">
                <div>Net Total</div>
                <div className="right total-money">
                  ฿ {(orderSnapshot.subtotal - orderSnapshot.discountAmount).toFixed(2)}
                </div>
              </div>
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: 10 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-soft" onClick={() => setStep("PAYMENT")}>
                Back
              </button>
              <button className="btn-primary" onClick={confirmPay}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "RECEIPT" && (saleInfo || orderSnapshot) && (
        <div className="modal-backdrop">
          <div className="modal-card receipt print-area">
            <button className="modal-x no-print" onClick={closeAllModals}>
              ×
            </button>

            <div className="receipt-brand">
              <span>CP</span> POS
            </div>
            <div className="receipt-sub">Cafe POS Solution</div>

            <div className="receipt-block">
              <div>
                <b>Receipt</b>
              </div>
              <div>No: {saleInfo?.sale_id ?? "-"}</div>
              <div>
                Date:{" "}
                {saleInfo?.sale_datetime
                  ? new Intl.DateTimeFormat("th-TH", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                      hour12: false,
                      timeZone: "Asia/Bangkok",
                    }).format(
                      new Date(
                        saleInfo.sale_datetime.endsWith("Z")
                          ? saleInfo.sale_datetime
                          : saleInfo.sale_datetime + "Z"
                      )
                    )
                  : "-"}
              </div>
              <div>Created by: -</div>
              <div>Payment: {paymentMethod}</div>
              <div>
                Customer:{" "}
                {memberInfo?.name
                  ? `${memberInfo.name} (#${memberInfo.member_id})`
                  : orderSnapshot?.memberName
                  ? `${orderSnapshot.memberName} (#${orderSnapshot.memberId})`
                  : "Walk-in Customer"}
              </div>
            </div>

            <div className="receipt-table">
              <div className="rt-head">
                <div>Name</div>
                <div className="center">Qty</div>
                <div className="right">Subtotal</div>
              </div>
              {orderSnapshot?.items?.map((it) => (
                <div className="rt-row" key={it.menu_id}>
                  <div>{it.name}</div>
                  <div className="center">{it.qty}</div>
                  <div className="right">{(it.price * it.qty).toFixed(2)}</div>
                </div>
              ))}
              <div className="rt-total">
                <div>Total</div>
                <div className="right">
                  {Number(orderSnapshot?.subtotal || 0).toFixed(2)}
                </div>
              </div>
              {Number(saleInfo?.discount_amount || orderSnapshot?.discountAmount || 0) > 0 && (
                <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                  <div>Discount</div>
                  <div className="right">
                    -{Number(saleInfo?.discount_amount || orderSnapshot?.discountAmount || 0).toFixed(2)}
                  </div>
                </div>
              )}
              <div className="rt-total" style={{ borderTop: "none", paddingTop: 0 }}>
                <div>
                  <b>Grand Total</b>
                </div>
                <div className="right">
                  <b>
                    {Number(
                      saleInfo?.net_total || (orderSnapshot?.subtotal - (orderSnapshot?.discountAmount || 0)) || 0
                    ).toFixed(2)}
                  </b>
                </div>
              </div>
              {paymentMethod === "Cash" && (
                <>
                  <div
                    className="rt-total"
                    style={{ borderTop: "none", paddingTop: 0 }}
                  >
                    <div>Cash received</div>
                    <div className="right">
                      {Number(
                        saleInfo?.cash_received || cashReceived || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div
                    className="rt-total"
                    style={{ borderTop: "none", paddingTop: 0 }}
                  >
                    <div>Change</div>
                    <div className="right">
                      <b>
                        {Number(
                          saleInfo?.change_amount || changeAmount || 0
                        ).toFixed(2)}
                      </b>
                    </div>
                  </div>
                </>
              )}
              <div className="rt-total">
                <div>Paid</div>
                <div className="right">
                  {Number(saleInfo?.net_total || (orderSnapshot?.subtotal - (orderSnapshot?.discountAmount || 0)) || 0).toFixed(2)}
                </div>
              </div>
              <div className="rt-total">
                <div>Balance Due</div>
                <div className="right">
                  0.00
                </div>
              </div>
            </div>

            <div className="modal-actions no-print">
              <button className="btn-soft" onClick={closeAllModals}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
