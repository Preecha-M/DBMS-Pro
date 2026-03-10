import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./InventoryPage.css";
import CustomSelect from "../components/CustomSelect";

// Block minus, e/E, + in numeric inputs
const blockInvalidNumKey = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

// Today's date string for date min validation
const todayStr = () => new Date().toISOString().split("T")[0];

export default function InventoryPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("withdraw");


  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Create Order State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderItems, setOrderItems] = useState([]);

  // Create Supplier State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ supplier_name: "", contact: "" });

  const loadIngredients = async () => {
    try {
      const res = await api.get("/ingredients");
      setIngredients(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/ingredients/categories");
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get("/ingredients/transactions");
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.get("/ingredients/alerts?days=7");
      // API returns { expired: [...], expiringSoon: [...] } — flatten to one array
      const data = res.data;
      const combined = [
        ...(Array.isArray(data?.expired) ? data.expired : []),
        ...(Array.isArray(data?.expiringSoon) ? data.expiringSoon : []),
      ];
      setAlerts(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadOrders();
    loadCategories();
    loadSuppliers();
    loadTransactions();
    loadAlerts();
  }, [tab]);

  // Withdraw State
  const [wdId, setWdId] = useState("");
  const [wdQty, setWdQty] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!wdId || !wdQty) return setError(t('inventory.errWithdrawEmpty'));
    const qty = Number(wdQty);
    if (!qty || qty < 1) return setError(t('inventory.errWithdrawEmpty'));
    try {
      await api.post(`/ingredients/${wdId}/withdraw`, { quantity: qty });
      setSuccess(t('inventory.sucWithdraw'));
      setWdId(""); setWdQty("");
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  // Add Ingredient State
  const [addForm, setAddForm] = useState({
    ingredient_id: "", ingredient_name: "", unit: "", cost_per_unit: "", quantity_on_hand: 0, expire_date: "", category_code: ""
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const cost = Number(addForm.cost_per_unit);
    const qty = Number(addForm.quantity_on_hand);
    if (cost < 0) return setError(t('inventory.errDefault') + " (ต้นทุนต้องไม่ติดลบ)");
    if (qty < 0) return setError(t('inventory.errDefault') + " (จำนวนต้องไม่ติดลบ)");
    try {
      await api.post("/ingredients", {
        ...addForm,
        cost_per_unit: cost,
        quantity_on_hand: qty
      });
      setSuccess(t('inventory.sucAddIngredient'));
      setAddForm({ ingredient_id: "", ingredient_name: "", unit: "", cost_per_unit: "", quantity_on_hand: 0, expire_date: "", category_code: "" });
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  // Update Order State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingOrderId, setReceivingOrderId] = useState(null);
  const [receivingItems, setReceivingItems] = useState([]);

  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    if (currentStatus.toLowerCase() === 'received') return;
    
    // Open receive modal to get expiration dates
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return;
    
    setReceivingOrderId(orderId);
    setReceivingItems(order.items.map(it => ({
      order_item_id: it.order_item_id,
      ingredient_name: it.ingredient_name || t('inventory.unknownIngredient'),
      quantity: it.quantity,
      unit: it.unit || "",
      expire_date: ""
    })));
    setShowReceiveModal(true);
  };

  const submitReceiveOrder = async (e) => {
    e.preventDefault();
    if (!window.confirm(t('inventory.confirmReceiveObject'))) return;
    try {
      await api.put(`/orders/${receivingOrderId}/status`, { 
        order_status: "Received",
        itemExpiries: receivingItems.map(it => ({
          order_item_id: it.order_item_id,
          expire_date: it.expire_date || null
        }))
      });
      setSuccess(t('inventory.sucUpdateStatus'));
      setShowReceiveModal(false);
      loadOrders();
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  // Create Order Handlers
  const handleOpenOrderModal = () => {
    setOrderSupplier("");
    setOrderItems([]);
    setShowOrderModal(true);
    setError("");
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { ingredient_id: "", quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate
    if (!orderSupplier) return setError(t('inventory.errOrderSupplierEmpty'));
    if (orderItems.length === 0) return setError(t('inventory.errOrderItemsEmpty'));
    if (orderItems.some(it => !it.ingredient_id || it.quantity <= 0)) {
      return setError(t('inventory.errOrderValidation'));
    }

    try {
      await api.post("/orders", {
        supplier_id: Number(orderSupplier),
        items: orderItems.map(it => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost)
        }))
      });
      setSuccess(t('inventory.sucCreateOrder'));
      setShowOrderModal(false);
      loadOrders();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errCreateOrderList'));
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const res = await api.post("/suppliers", supplierForm);
      setSuccess(t('inventory.sucAddSupplier'));
      setShowSupplierModal(false);
      setSupplierForm({ supplier_name: "", contact: "" });
      loadSuppliers();
      if (res.data?.supplier_id) {
        setOrderSupplier(res.data.supplier_id);
      }
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateString) < today;
  };

  const getSortedWithdrawableIngredients = () => {
    return ingredients.map(ig => ({
      ...ig,
      total_unexpired: (ig.ingredient_batch || [])
        .filter(b => b.quantity_on_hand > 0 && !isExpired(b.expire_date))
        .reduce((sum, b) => sum + b.quantity_on_hand, 0)
    })).filter(ig => ig.total_unexpired > 0);
  };

  return (
    <div className="page-pad">
      <div className="inventory-desktop-wrapper">
        <h2 style={{ marginBottom: 20 }}>{t('inventory.pageTitle')}</h2>

        <div className="inventory-tabs">
        <div className={`inv-tab ${tab === "withdraw" ? "active" : ""}`} onClick={() => { setTab("withdraw"); setError(""); setSuccess(""); }}>
          {t('inventory.tabWithdraw')}
        </div>
        <div className={`inv-tab ${tab === "list" ? "active" : ""}`} onClick={() => { setTab("list"); setError(""); setSuccess(""); }}>
          {t('inventory.tabList')}
        </div>
        <div className={`inv-tab ${tab === "add" ? "active" : ""}`} onClick={() => { setTab("add"); setError(""); setSuccess(""); }}>
          {t('inventory.tabAdd')}
        </div>
        <div className={`inv-tab ${tab === "add_supplier" ? "active" : ""}`} onClick={() => { setTab("add_supplier"); setError(""); setSuccess(""); }}>
          {t('inventory.tabAddSupplier')}
        </div>
        <div className={`inv-tab ${tab === "orders" ? "active" : ""}`} onClick={() => { setTab("orders"); setError(""); setSuccess(""); }}>
          {t('inventory.tabOrders')}
        </div>
        <div className={`inv-tab ${tab === "transactions" ? "active" : ""}`} onClick={() => { setTab("transactions"); setError(""); setSuccess(""); }}>
          {t('inventory.tabTransactions')}
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      {tab === "withdraw" && (
        <div className="card inv-form-container" style={{ padding: 24 }}>
          <form onSubmit={handleWithdraw}>
            <div className="input-group">
              <label>{t('inventory.selectIngredientLabel')}</label>
              <CustomSelect
                value={wdId}
                onChange={(val) => setWdId(val)}
                placeholder={t('inventory.optSelectIngredient')}
                options={[
                  { value: '', label: t('inventory.optSelectIngredient') },
                  ...getSortedWithdrawableIngredients().map(ig => ({
                    value: String(ig.ingredient_id),
                    label: `${ig.ingredient_name} (${t('inventory.strRemaining')} ${ig.total_unexpired} ${ig.unit})`
                  }))
                ]}
              />
            </div>
            <div className="input-group">
              <label>{t('inventory.withdrawQtyLabel')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  min="1"
                  step="1"
                  value={wdQty} 
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    setWdQty(isNaN(v) ? "" : String(Math.max(1, v)));
                  }}
                  onKeyDown={blockInvalidNumKey}
                  required 
                  style={{ flex: 1 }}
                />
                {wdId && (
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-green)' }}>
                    {ingredients.find(i => i.ingredient_id === wdId)?.unit || ""}
                  </span>
                )}
              </div>
            </div>
            <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 12 }}>{t('inventory.btnConfirmWithdraw')}</button>
          </form>
        </div>
      )}

      {tab === "list" && (
        <div className="card" style={{ padding: 24 }}>
          <div className="overflow-x-auto">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>{t('inventory.addIdLabel')}</th>
                  <th>{t('inventory.colIgName')}</th>
                  <th>{t('inventory.colIgCategory')}</th>
                  <th>{t('inventory.colIgQty')}</th>
                  <th>{t('inventory.colIgCost')}</th>
                  <th>{t('inventory.colIgExpire')}</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.flatMap(ig => {
                  // Filter out zero-quantity batches; if none left, skip ingredient entirely
                  const nonZeroBatches = (ig.ingredient_batch || []).filter(b => b.quantity_on_hand > 0);
                  if (nonZeroBatches.length === 0) return [];

                  return nonZeroBatches.map((batch, bidx) => {
                    const expired = isExpired(batch.expire_date);
                    const expiringSoon = alerts.some(a => a.batch_id === batch.batch_id);
                    const isFirstBatch = bidx === 0;

                    return (
                      <tr key={`${ig.ingredient_id}-${batch.batch_id}`}>
                        {isFirstBatch ? (
                          <>
                            <td rowSpan={nonZeroBatches.length}>{ig.ingredient_id}</td>
                            <td rowSpan={nonZeroBatches.length}>{ig.ingredient_name}</td>
                            <td rowSpan={nonZeroBatches.length}>{ig.category_name || "-"}</td>
                          </>
                        ) : null}
                        <td style={{ fontWeight: 'bold' }}>
                          {`${batch.quantity_on_hand} ${ig.unit}`}
                        </td>
                        <td>{batch.cost_per_unit ?? ig.cost_per_unit ?? "-"}</td>
                        <td style={{ 
                          color: expired ? '#d93025' : (expiringSoon ? '#f29900' : 'inherit'),
                          fontWeight: (expired || expiringSoon) ? 'bold' : 'normal'
                        }}>
                          {batch.expire_date ? new Date(batch.expire_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : t('inventory.expireNotSet')}
                          {expired && <span style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', background: '#fce8e6', borderRadius: 4 }}>{t('inventory.alertExpired', 'Expired')}</span>}
                          {!expired && expiringSoon && <span style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', background: '#fef7e0', borderRadius: 4 }}>{t('inventory.alertExpiring', 'Expiring Soon')}</span>}
                        </td>
                      </tr>
                    );
                  });
                })}
                {ingredients.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>-</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "add" && (
        <div className="card inv-form-container" style={{ padding: 24 }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="input-group">
                <label>{t('inventory.addIdLabel')}</label>
                <input value={addForm.ingredient_id} onChange={e => setAddForm(p => ({ ...p, ingredient_id: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('inventory.addNameLabel')}</label>
                <input value={addForm.ingredient_name} onChange={e => setAddForm(p => ({ ...p, ingredient_name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('inventory.addCategoryLabel')}</label>
                <CustomSelect
                  value={addForm.category_code}
                  onChange={(val) => setAddForm(p => ({ ...p, category_code: val }))}
                  placeholder={t('inventory.optNoCategory')}
                  options={[
                    { value: '', label: t('inventory.optNoCategory') },
                    ...categories.map(c => ({ value: String(c.category_id || c.category_code), label: c.category_name }))
                  ]}
                />
              </div>
              <div className="input-group">
                <label>{t('inventory.addUnitLabel')}</label>
                <input value={addForm.unit} onChange={e => setAddForm(p => ({ ...p, unit: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('inventory.addCostLabel')}</label>
                <input type="number" min="0" step="0.01"
                  value={addForm.cost_per_unit}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setAddForm(p => ({ ...p, cost_per_unit: isNaN(v) ? "" : String(Math.max(0, v)) }));
                  }}
                  onKeyDown={blockInvalidNumKey}
                />
              </div>
              <div className="input-group">
                <label>{t('inventory.addInitialStockLabel')}</label>
                <input type="number" min="0" step="1"
                  value={addForm.quantity_on_hand}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    setAddForm(p => ({ ...p, quantity_on_hand: isNaN(v) ? 0 : Math.max(0, v) }));
                  }}
                  onKeyDown={blockInvalidNumKey}
                />
              </div>
              <div className="input-group">
                <label>{t('inventory.addExpireDateLabel', 'Expiration Date')}</label>
                <input type="date" min={todayStr()} value={addForm.expire_date || ""}
                  onChange={e => setAddForm(p => ({ ...p, expire_date: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 20 }}>{t('inventory.btnSaveData')}</button>
          </form>
        </div>
      )}

      {tab === "add_supplier" && (
        <div className="card inv-form-container" style={{ padding: 24 }}>
          <form onSubmit={handleAddSupplier}>
            <div className="input-group">
              <label>{t('inventory.supNameLabel')}</label>
              <input value={supplierForm.supplier_name} onChange={e => setSupplierForm(p => ({ ...p, supplier_name: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>{t('inventory.supContactLabel')}</label>
              <input value={supplierForm.contact} onChange={e => setSupplierForm(p => ({ ...p, contact: e.target.value }))} />
            </div>
            <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 12 }}>{t('inventory.btnSaveSupplier')}</button>
          </form>
        </div>
      )}

      {tab === "orders" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="pos-neworder-btn" onClick={handleOpenOrderModal}>{t('inventory.btnCreateOrder')}</button>
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
                  <td>#{o.order_id}</td>
                  <td>{new Date(o.order_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}</td>
                  <td>{o.supplier_name || "-"}</td>
                  <td>
                    ฿{o.items?.reduce((sum, it) => sum + Number(it.unit_cost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`inv-badge ${String(o.order_status).toLowerCase() === 'received' ? 'received' : 'pending'}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td>
                    {String(o.order_status).toLowerCase() !== 'received' && (
                      <button className="btn-soft" onClick={() => handleUpdateOrderStatus(o.order_id, o.order_status)} style={{ whiteSpace: 'nowrap', padding: '5px 12px', fontSize: 13 }}>
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
      )}

      {tab === "transactions" && (
        <div className="card" style={{ padding: 24 }}>
          <div className="overflow-x-auto">
            <table className="inv-table">
            <thead>
              <tr>
                <th>{t('inventory.colTxDate')}</th>
                <th>{t('inventory.colTxIgId')}</th>
                <th>{t('inventory.colTxIgName')}</th>
                <th>{t('inventory.colTxType')}</th>
                <th>{t('inventory.colTxQtyChange')}</th>
                <th>{t('inventory.colTxEmployee', 'ผู้ทำรายการ')}</th>
                <th>{t('inventory.colTxNote')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.transaction_id}>
                  <td>{formatDate(t.transaction_date)}</td>
                  <td>{t.ingredient_id}</td>
                  <td>{t.ingredient?.ingredient_name || "-"}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                      backgroundColor: t.transaction_type === 'IN' ? '#e6f4ea' : '#fce8e6',
                      color: t.transaction_type === 'IN' ? '#1e8e3e' : '#d93025'
                    }}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td style={{ 
                    fontWeight: 'bold', 
                    color: t.quantity > 0 ? '#1e8e3e' : '#d93025'
                  }}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.ingredient?.unit || ""}
                  </td>
                  <td>
                    {t.employee ? (t.employee.first_name_th ? `${t.employee.first_name_th} ${t.employee.last_name_th || ''}`.trim() : t.employee.username) : "-"}
                  </td>
                  <td className="muted">
                    {t.notes} {t.reference_id ? `(#${t.reference_id})` : ''}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan="7" style={{ textAlign: "center" }}>{t('inventory.noTransactions')}</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="modal-backdrop">
          <div className="modal-card wide">
            <button className="modal-x" onClick={() => setShowOrderModal(false)}>×</button>
            <div className="modal-title">{t('inventory.orderModalTitle')}</div>
            <form onSubmit={handleCreateOrder}>
              <div className="input-group">
                <label>{t('inventory.orderToSupplierLabel')}</label>
                <CustomSelect
                  value={orderSupplier}
                  onChange={(val) => setOrderSupplier(val)}
                  placeholder={t('inventory.optSelectSupplier')}
                  options={[
                    { value: '', label: t('inventory.optSelectSupplier') },
                    ...suppliers.map(s => ({ value: String(s.supplier_id), label: s.supplier_name }))
                  ]}
                />
              </div>

              <div style={{ marginTop: 24, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{t('inventory.orderItemsTitle')}</div>
                <button type="button" className="btn-soft" style={{ padding: '4px 12px' }} onClick={handleAddOrderItem}>
                  {t('inventory.btnAddOrderItem')}
                </button>
              </div>

              {orderItems.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', background: '#f8f9fa', borderRadius: 8, color: '#6c757d' }}>
                  {t('inventory.noOrderItems')}
                </div>
              )}

              {orderItems.map((item, index) => {
                const selectedIngredient = ingredients.find(i => i.ingredient_id === item.ingredient_id);
                const unit = selectedIngredient?.unit || "";
                
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemIngredient')}</label>
                      <CustomSelect
                        value={item.ingredient_id}
                        onChange={(val) => handleUpdateOrderItem(index, 'ingredient_id', val)}
                        placeholder={t('inventory.optSelect')}
                        options={[
                          { value: '', label: t('inventory.optSelect') },
                          ...ingredients.map(ig => ({ value: String(ig.ingredient_id), label: ig.ingredient_name }))
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemQty', { unit: unit ? `(${unit})` : '' })}</label>
                        <input 
                          type="number" 
                          min="1"
                          step="1"
                          value={item.quantity} 
                          onChange={e => {
                            const v = parseInt(e.target.value, 10);
                            handleUpdateOrderItem(index, 'quantity', isNaN(v) ? 1 : Math.max(1, v));
                          }}
                          onKeyDown={blockInvalidNumKey}
                          required
                          style={{ width: '100%', padding: 8, border: '1.5px solid var(--border-color)', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemCost')}</label>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.unit_cost} 
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            handleUpdateOrderItem(index, 'unit_cost', isNaN(v) ? 0 : Math.max(0, v));
                          }}
                          onKeyDown={blockInvalidNumKey}
                          style={{ width: '100%', padding: 8, border: '1.5px solid var(--border-color)', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveOrderItem(index)}
                          style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 13 }}
                        >
                          {t('inventory.btnDelete')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={() => setShowOrderModal(false)}>{t('inventory.btnCancel')}</button>
                <button type="submit" className="btn-primary">{t('inventory.btnConfirmOrderSubmit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiveModal && (
        <div className="modal-backdrop">
          <div className="modal-card wide">
            <button className="modal-x" onClick={() => setShowReceiveModal(false)}>×</button>
            <div className="modal-title">{t('inventory.receiveModalTitle', 'Receive Order Items')}</div>
            <form onSubmit={submitReceiveOrder}>
              <p style={{ marginBottom: 16, color: '#6c757d' }}>
                {t('inventory.receiveModalDesc', 'Please enter the expiration date for each received item (if applicable).')}
              </p>
              
              {receivingItems.map((item, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 'bold' }}>{item.ingredient_name}</div>
                  <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6 }}>
                    {t('inventory.orderItemQty', 'Quantity')}: {item.quantity} {item.unit}
                  </div>
                  <div>
                    <label style={{ fontSize: 13 }}>{t('inventory.addExpireDateLabel', 'Expiration Date')}</label>
                    <input 
                      type="date" 
                      value={item.expire_date} 
                      onChange={e => {
                        const newItems = [...receivingItems];
                        newItems[index].expire_date = e.target.value;
                        setReceivingItems(newItems);
                      }}
                      style={{ width: '100%', padding: 8, border: '1.5px solid var(--border-color)', borderRadius: 8, fontFamily: 'inherit', marginTop: 4 }}
                    />
                  </div>
                </div>
              ))}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={() => setShowReceiveModal(false)}>{t('inventory.btnCancel')}</button>
                <button type="submit" className="btn-primary">{t('inventory.btnConfirmReceive', 'Confirm Receive')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
