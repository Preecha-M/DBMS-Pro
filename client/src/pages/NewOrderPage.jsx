import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import { Coffee, CupSoda, Croissant, CakeSlice, Utensils, Hash, LayoutGrid } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { useAuth } from "../auth/useAuth";
import "./NewOrderPage.css";

// Helper to render lucide icon based on text input
const renderCategoryIcon = (iconName, size = 24) => {
  const name = String(iconName || "").toLowerCase();
  if (name.includes("coffee") || name.includes("กาแฟ") || name.includes("☕")) return <Coffee size={size} />;
  if (name.includes("no") || name.includes("tea") || name.includes("ชา") || name.includes("🍵") || name.includes("soda") || name.includes("โซดา") || name.includes("drink") || name.includes("เครื่องดื่ม")) return <CupSoda size={size} />;
  if (name.includes("bakery") || name.includes("เบเกอรี่") || name.includes("🥐")) return <Croissant size={size} />;
  if (name.includes("cake") || name.includes("เค้ก") || name.includes("🍰") || name.includes("dessert") || name.includes("ของหวาน")) return <CakeSlice size={size} />;
  if (name.includes("food") || name.includes("อาหาร") || name.includes("🍝")) return <Utensils size={size} />;
  return <Hash size={size} />;
};

export default function NewOrderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);
  const [cats, setCats] = useState([]);
  const [cart, setCart] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);
  const [saleInfo, setSaleInfo] = useState(null);
  const [error, setError] = useState("");

  const [selectingItem, setSelectingItem] = useState(null);

  const [step, setStep] = useState("ORDER");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [memberId, setMemberId] = useState("");
  const [memberInfo, setMemberInfo] = useState(null);
  const [orderSnapshot, setOrderSnapshot] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [manualDiscount, setManualDiscount] = useState("");
  const [nextSaleId, setNextSaleId] = useState(1);

  const activeCatId = params.get("cat") ? Number(params.get("cat")) : null;

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [mRes, cRes, pRes, optRes, salesRes] = await Promise.all([
        api.get("/menu"),
        api.get("/categories"),
        api.get("/promotions"),
        api.get("/menu-options/groups"),
        api.get("/sales"), // Assuming this endpoint returns a list of sales or latest sales
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

      const optGroups = Array.isArray(optRes.data) ? optRes.data : [];
      setOptionGroups(optGroups);

      // Extract the highest sale_id to determine the next one
      let nextId = 1;
      if (salesRes.data && Array.isArray(salesRes.data) && salesRes.data.length > 0) {
        // Find the maximum sale_id from the results
        const maxId = Math.max(...salesRes.data.map(s => Number(s.sale_id) || 0));
        nextId = maxId + 1;
      }
      setNextSaleId(nextId);

    } catch (e) {
      setError(e?.response?.data?.message || t('newOrder.loadingFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pillCats = useMemo(
    () => [{ category_id: null, category_name: t('newOrder.allCategories') }, ...cats],
    [cats, t]
  );

  const visibleMenus = useMemo(() => {
    if (!activeCatId) return menus;
    return menus.filter((m) => Number(m.category_id) === activeCatId);
  }, [menus, activeCatId]);

  const handleProductSelect = (m) => {
    // Filter option groups to only those that apply to this menu
    // Option groups apply if menu_ids array is empty (legacy/global) or it explicitly includes this menu ID.
    const relevantOptionGroups = optionGroups.filter(g => {
      if (!g.menu_ids || g.menu_ids.length === 0) return true; // Global/Unassigned
      return g.menu_ids.includes(m.menu_id);
    });

    if (relevantOptionGroups.length > 0) {
      setSelectingItem({ ...m, selectedOptions: [], relevantOptionGroups });
    } else {
      addToCart(m, []);
    }
  };

  const addToCart = (m, options) => {
    setCart((prev) => {
      // Find if there's an existing item with the exact same menu_id and options
      const existingItemIndex = prev.findIndex(item => {
        if (item.menu_id !== m.menu_id) return false;
        
        const itemOpts = item.options || [];
        const newOpts = options || [];
        
        if (itemOpts.length !== newOpts.length) return false;
        
        // Sort option IDs and compare them to ensure they represent the exact same selections
        const itemOptIds = itemOpts.map(o => o.item_id).sort().join(',');
        const newOptIds = newOpts.map(o => o.item_id).sort().join(',');
        
        return itemOptIds === newOptIds;
      });

      if (existingItemIndex >= 0) {
        // Increment quantity of the existing identical item
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          qty: newCart[existingItemIndex].qty + 1
        };
        return newCart;
      }

      // Generate a unique ID for the new cart item combination
      const cartItemId = m.menu_id + "_" + Date.now() + Math.random().toString(36).slice(2,5);
      return [...prev, { ...m, cartItemId, qty: 1, options }];
    });
    setSelectingItem(null);
  };

  const inc = (cartItem) => {
    setCart((prev) =>
      prev.map((x) =>
        x.cartItemId === cartItem.cartItemId ? { ...x, qty: x.qty + 1 } : x
      )
    );
  };

  const dec = (cartItemId) => {
    setCart((prev) => {
      const found = prev.find((x) => x.cartItemId === cartItemId);
      if (!found) return prev;
      if (found.qty <= 1) return prev.filter((x) => x.cartItemId !== cartItemId);
      return prev.map((x) =>
        x.cartItemId === cartItemId ? { ...x, qty: x.qty - 1 } : x
      );
    });
  };

  const subtotal = useMemo(
    () => cart.reduce((s, it) => {
      let itemPrice = Number(it.price || 0);
      let optionsPrice = it.options?.reduce((optSum, opt) => optSum + Number(opt.additional_price || 0), 0) || 0;
      return s + ((itemPrice + optionsPrice) * it.qty);
    }, 0),
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
    const applicableTotal = applicableItems.reduce((s, it) => {
      let itemPrice = Number(it.price || 0);
      let optionsPrice = it.options?.reduce((optSum, opt) => optSum + Number(opt.additional_price || 0), 0) || 0;
      return s + ((itemPrice + optionsPrice) * it.qty);
    }, 0);
    
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
    const promoD = Number(discountAmount || 0);
    const manualD = Math.min(Number(manualDiscount || 0), subtotal); // can't exceed subtotal
    const net = subtotal - promoD - manualD;
    return Math.max(cash - net, 0);
  }, [cashReceived, subtotal, paymentMethod, discountAmount, manualDiscount]);

  const totalDiscountAmount = useMemo(() => {
    return Number(discountAmount || 0) + Math.min(Number(manualDiscount || 0), subtotal);
  }, [discountAmount, manualDiscount, subtotal]);

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

  const tempInvoice = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(nextSaleId).padStart(4, "0")}`;

  const invoiceNo = saleInfo?.sale_id
    ? `Invoice No: ${saleInfo.receipt_number || saleInfo.sale_id} ${formatDateTime(
        saleInfo.sale_datetime
      )}`
    : `Invoice No: ${tempInvoice} (Pending)`;

  const orderNo = saleInfo?.sale_id
    ? `Order: ${saleInfo.receipt_number || saleInfo.sale_id}`
    : `Order: ${tempInvoice}`;

  const checkMember = async () => {
    setMemberInfo(null);
    const phone = memberId.trim();
    if (!phone) return null;

    const res = await api.get(`/members?phone=${encodeURIComponent(phone)}`);

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
      const net = subtotal - totalDiscountAmount;
      if (!cashReceived || cashReceived === "") {
        setError(t('newOrder.enterCashAmount'));
        return;
      }
      if (Number(cashReceived) < net) {
        setError(
          t('newOrder.notEnoughCash', { amount: (net - Number(cashReceived)).toFixed(2) })
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
          options: it.options || [],
          cartItemId: it.cartItemId,
        })),
        subtotal,
        qty,
        earnedPoints,
        paymentMethod,
        discountAmount: totalDiscountAmount,
        selectedPromo,
        memberId: info?.member_id ?? null,
        memberName: info?.name ?? null,
      };

      setOrderSnapshot(snapshot);
      setStep("CONFIRM");
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || t('newOrder.memberCheckFailed')
      );
    }
  };

  const confirmPay = async () => {
    setError("");
    if (!orderSnapshot?.items?.length) return;

    if (paymentMethod === "Cash") {
      const net = orderSnapshot.subtotal - orderSnapshot.discountAmount;
      if (!cashReceived || cashReceived === "") {
        setError(t('newOrder.enterCashAmount'));
        return;
      }

      if (Number(cashReceived) < net) {
        setError(
          t('newOrder.notEnoughCash', { amount: (net - Number(cashReceived)).toFixed(2) })
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
        receipt_number: tempInvoice,
        items: orderSnapshot.items.map((it) => ({
          menu_id: it.menu_id,
          quantity: it.qty,
          options: it.options || [] // Pass options to the API
        })),
      };

      const res = await api.post("/sales", payload);
      setSaleInfo(res.data);
      setCart([]);
      setStep("RECEIPT");
    } catch (e) {
      setError(e?.response?.data?.message || t('newOrder.saveFailed'));
    }
  };

    const closeAllModals = () => {
    if (saleInfo) {
      setNextSaleId(prev => prev + 1);
    }
    setStep("ORDER");
    setError("");
    setCashReceived("");
    setSelectedPromoId("");
    setManualDiscount("");
    setSaleInfo(null);
    setOrderSnapshot(null);
  };

  return (
    <>
      <div className="new-order-page">
      {/* sub-nav: category pills */}
      <div className="new-order-subnav">
        {pillCats.map((c) => {
          const isActive = (!c.category_id && !activeCatId) || Number(c.category_id) === activeCatId;
          return (
            <button
              key={String(c.category_id)}
              type="button"
              className={`cat-filter-pill ${isActive ? "active" : ""}`}
              onClick={() => {
                if (!c.category_id) setParams({});
                else setParams({ cat: String(c.category_id) });
              }}
            >
              <div className="cat-filter-icon">
                {!c.category_id ? <LayoutGrid size={18} /> : renderCategoryIcon(c.icon || c.category_name, 18)}
              </div>
              <div>{c.category_name}</div>
            </button>
          );
        })}
      </div>

      {/* left: scrollable product grid */}
      <section className="new-order-products">
        {loading ? (
          <div className="page-pad">Loading...</div>
        ) : (
          <div className="product-grid">
            {visibleMenus.map((m) => (
              <div key={m.menu_id} className="product-card" onClick={() => handleProductSelect(m)}>
                <img
                  src={m.image_url || "https://cdn-icons-png.flaticon.com/512/924/924514.png"}
                  alt={m.menu_name}
                  className="product-image"
                />
                <div className="product-name">{m.menu_name}</div>
                <div className="product-price">
                  ฿ {Number(m.price || 0).toFixed(2)}
                </div>
              </div>
            ))}
            {visibleMenus.length === 0 && (
              <div className="page-pad">{t('newOrder.noMenuInCategory')}</div>
            )}
          </div>
        )}
      </section>

      {/* right: fixed cart column */}
      <div className="new-order-cart-col">
        <aside className="cart-panel">
          <div className="cart-head">
            <div className="cart-invoice">{invoiceNo}</div>

            <div className="cart-brand">
              <div className="cart-brand-logo">Ep</div>
              <div>
                <div className="cart-brand-title">CP POS</div>
                <div className="cart-brand-sub">{user?.username || 'cppos@gmail.com'}</div>
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
              <div className="cart-empty">{t('newOrder.emptyCart')}</div>
            ) : (
              cart.map((it) => (
                <div key={it.cartItemId} className="cart-row">
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
                        onClick={() => dec(it.cartItemId)}
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
                    <div style={{ textAlign: "right" }}>฿ {((Number(it.price || 0) + (it.options?.reduce((s,o)=>s+Number(o.additional_price||0),0)||0)) * it.qty).toFixed(2)}</div>
                    {it.options && it.options.length > 0 && (
                      <div style={{ fontSize: 11, color: "#9EA3AE", textAlign: "right", marginTop: 4 }}>
                        {it.options.map(o => o.option_name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-foot">
            <div className="cart-total">
              <div>
                <div className="cart-total-title">{t('newOrder.cartTotalTitle')}</div>
                <div className="cart-total-sub">
                  {t('newOrder.cartItemsCount')} {cart.length}, {t('newOrder.cartQuantity')} {qty}
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
              {t('newOrder.printInvoiceBtn')}
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
              {t('newOrder.paymentBtn')}
            </button>
          </div>
        </aside>
      </div>{/* /new-order-cart-col */}
    </div>{/* /new-order-page */}

    {/* ── Modals rendered outside the grid, but still inside Fragment ── */}
    {selectingItem && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={() => setSelectingItem(null)}>
              ×
            </button>
            <div className="modal-title">{t('newOrder.selectOptionsFor')} {selectingItem.menu_name}</div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
              {selectingItem.relevantOptionGroups?.map(group => (
                <div key={group.group_id} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{group.group_name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {group.menu_option_item && group.menu_option_item.map(opt => {
                      const isSelected = selectingItem.selectedOptions.some(o => o.item_id === opt.item_id);
                      return (
                        <label key={opt.item_id} style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                          padding: '12px', border: '1px solid ' + (isSelected ? 'var(--primary-green)' : '#ddd'),
                          borderRadius: 8, cursor: 'pointer', background: isSelected ? '#f1f8e9' : '#fff'
                        }}>
                          <div>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                let newOpts = [...selectingItem.selectedOptions];
                                if (e.target.checked) {
                                  newOpts.push({
                                    item_id: opt.item_id,
                                    option_name: opt.item_name,
                                    additional_price: Number(opt.additional_price || 0)
                                  });
                                } else {
                                  newOpts = newOpts.filter(o => o.item_id !== opt.item_id);
                                }
                                setSelectingItem({...selectingItem, selectedOptions: newOpts});
                              }}
                              style={{ marginRight: 8, transform: 'scale(1.2)' }}
                            />
                            {opt.item_name}
                          </div>
                          <div style={{ color: Number(opt.additional_price) > 0 ? 'var(--primary-orange)' : '#888', fontWeight: 600 }}>
                            {Number(opt.additional_price) > 0 ? `+${opt.additional_price} ฿` : t('newOrder.free')}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => addToCart(selectingItem, selectingItem.selectedOptions)}>
                {t('newOrder.addToCartWait', { amount: selectingItem.selectedOptions.reduce((s, o) => s + o.additional_price, 0) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "PAYMENT" && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={closeAllModals}>
              ×
            </button>

            <div className="modal-title">{t('newOrder.paymentTitle')}</div>

            <div className="input-group">
              <label>{t('newOrder.memberPhoneLabel')}</label>
              <input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder={t('newOrder.memberPhonePlaceholder')}
              />
            </div>

            <div className="input-group">
              <label>{t('newOrder.promoLabel')}</label>
              <CustomSelect
                value={selectedPromoId}
                onChange={(val) => setSelectedPromoId(val)}
                placeholder={t('newOrder.noPromoLabel')}
                options={[
                  { value: '', label: t('newOrder.noPromoLabel') },
                  ...promotions.map(p => {
                    const subtext = p.discount_type === 'PERCENTAGE'
                      ? t('newOrder.discountPercent', { amount: p.discount_value })
                      : t('newOrder.discountAmount', { amount: p.discount_value });
                    return { value: String(p.promotion_id), label: `${p.promotion_name} (${subtext})` };
                  })
                ]}
              />
            </div>

            {selectedPromo && (
              <div className="modal-note" style={{ marginTop: 8 }}>
                {t('newOrder.promoConditions')} {selectedPromo.discount_type === 'PERCENTAGE' ? t('newOrder.discountPercent', { amount: Number(selectedPromo.discount_value) }) : t('newOrder.discountAmount', { amount: Number(selectedPromo.discount_value) })} 
                {` | ${t('newOrder.minCups', { amount: selectedPromo.min_quantity })}`}
                {selectedPromo.menu_ids?.length > 0 && ` | ${t('newOrder.specificMenuOnly')}`}
                <span style={{ display: 'block', color: 'var(--primary-orange)', marginTop: 4 }}>
                  {t('newOrder.discountApplied')} <b>{discountAmount > 0 ? `-${discountAmount.toFixed(2)} บาท` : t('newOrder.discountNotMet')}</b>
                </span>
              </div>
            )}

            <div className="input-group" style={{ marginTop: 12 }}>
              <label>ส่วนลดพิเศษ (บาท) <span style={{ fontWeight: 400, color: '#9EA3AE' }}>– สำหรับโปรฯ นอกระบบ</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualDiscount}
                onChange={(e) => setManualDiscount(e.target.value)}
                placeholder="0.00"
              />
              {Number(manualDiscount) > 0 && (
                <div className="modal-note" style={{ color: 'var(--primary-orange)' }}>
                  ส่วนลดรวม: <b>-{totalDiscountAmount.toFixed(2)} บาท</b>
                  &nbsp;|&nbsp; ยอดสุทธิ: <b>฿ {Math.max(0, subtotal - totalDiscountAmount).toFixed(2)}</b>
                </div>
              )}
            </div>

            <div className="input-group" style={{ marginTop: 12 }}>
              <label>{t('newOrder.paymentMethod')}</label>
              <CustomSelect
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Credit Card', label: 'Credit Card' },
                  { value: 'QR', label: 'QR' },
                ]}
              />
            </div>
            {paymentMethod === "Cash" && (
              <div className="input-group">
                <label>{t('newOrder.cashReceivedLabel')}</label>
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={t('newOrder.cashReceivedPlaceholder')}
                />
                <div className="modal-note">
                  {t('newOrder.changeAmountLabel')} <b>{changeAmount.toFixed(2)}</b>
                </div>
              </div>
            )}

            <div className="modal-note">
              {t('newOrder.pointsEarnedLabel')} <b>{earnedPoints}</b> {t('newOrder.pointsUnit')}
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: 10 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-soft" onClick={closeAllModals}>
                {t('newOrder.cancelBtn')}
              </button>
              <button
                className="btn-primary"
                onClick={goConfirm}
              >
                {t('newOrder.nextBtn')}
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

            <div className="modal-title center">{t('newOrder.confirmOrderTitle')}</div>
            <div className="modal-sub center">
              {t('newOrder.confirmOrderSub')}
            </div>

            <div className="confirm-table">
              <div className="confirm-head">
                <div>{t('newOrder.itemNameCol')}</div>
                <div>{t('newOrder.qtyCol')}</div>
                <div>{t('newOrder.priceCol')}</div>
                <div>{t('newOrder.subtotalCol')}</div>
              </div>

              {orderSnapshot.items.map((it, idx) => (
                <div className="confirm-row" key={it.cartItemId || it.menu_id + '_' + idx}>
                  <div>{it.name}</div>
                  <div className="center">{it.qty}</div>
                  <div className="right">฿ {it.price.toFixed(2)}</div>
                  <div className="right">
                    ฿ {(it.price * it.qty).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="confirm-sum">
                <div className="muted">{t('newOrder.totalPoints')}</div>
                <div className="right">
                  <b>{orderSnapshot.earnedPoints}</b>
                </div>
              </div>

              {orderSnapshot.discountAmount > 0 && (
                <div className="confirm-sum">
                  <div className="muted">{t('newOrder.promoDiscount')}</div>
                  <div className="right" style={{ color: "var(--primary-orange)" }}>
                    -฿ {orderSnapshot.discountAmount.toFixed(2)}
                  </div>
                </div>
              )}

              <div className="confirm-total">
                <div>{t('newOrder.netTotal')}</div>
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
                {t('newOrder.backBtn')}
              </button>
              <button className="btn-primary" onClick={confirmPay}>
                {t('newOrder.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "RECEIPT" && (saleInfo || orderSnapshot) && (
        <div className="modal-backdrop">
          <div className="modal-card receipt print-area">
            {/* ... receipt content ... */}
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
              <div>No: {saleInfo?.receipt_number || saleInfo?.sale_id || tempInvoice}</div>
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
              <div>Created by: {saleInfo?.employee_username || user?.first_name_th || user?.username || "-"}</div>
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
              {orderSnapshot?.items?.map((it, idx) => (
                <div className="rt-row" key={it.cartItemId || it.menu_id + '_' + idx}>
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
                {t('newOrder.cancelBtn')}
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                {t('newOrder.printBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
