import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./InventoryPage.css";

export default function InventoryPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("withdraw"); // withdraw | add | orders | transactions
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
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

  useEffect(() => {
    loadIngredients();
    loadOrders();
    loadCategories();
    loadSuppliers();
    loadTransactions();
  }, [tab]);

  // Withdraw State
  const [wdId, setWdId] = useState("");
  const [wdQty, setWdQty] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!wdId || !wdQty) return setError(t('inventory.errWithdrawEmpty'));
    try {
      await api.post(`/ingredients/${wdId}/withdraw`, { quantity: Number(wdQty) });
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
    try {
      await api.post("/ingredients", {
        ...addForm,
        cost_per_unit: Number(addForm.cost_per_unit),
        quantity_on_hand: Number(addForm.quantity_on_hand)
      });
      setSuccess(t('inventory.sucAddIngredient'));
      setAddForm({ ingredient_id: "", ingredient_name: "", unit: "", cost_per_unit: "", quantity_on_hand: 0, expire_date: "", category_code: "" });
      loadIngredients();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  // Update Order State
  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    if (currentStatus.toLowerCase() === 'received') return;
    if (!window.confirm(t('inventory.confirmReceiveObject'))) return;
    try {
      await api.put(`/orders/${orderId}/status`, { order_status: "Received" });
      setSuccess(t('inventory.sucUpdateStatus'));
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
      minute: "2-digit"
    });

  return (
    <div className="page-pad">
      <h2 style={{ marginBottom: 20 }}>{t('inventory.pageTitle')}</h2>

      <div className="inventory-tabs">
        <div className={`inv-tab ${tab === "withdraw" ? "active" : ""}`} onClick={() => { setTab("withdraw"); setError(""); setSuccess(""); }}>
          {t('inventory.tabWithdraw')}
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
              <select value={wdId} onChange={e => setWdId(e.target.value)} required>
                <option value="">{t('inventory.optSelectIngredient')}</option>
                {ingredients.map(ig => (
                  <option key={ig.ingredient_id} value={ig.ingredient_id}>
                    {ig.ingredient_name} ({t('inventory.strRemaining')} {ig.quantity_on_hand} {ig.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>{t('inventory.withdrawQtyLabel')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  min="1" 
                  value={wdQty} 
                  onChange={e => setWdQty(e.target.value)} 
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
                <select value={addForm.category_code} onChange={e => setAddForm(p => ({ ...p, category_code: e.target.value }))}>
                  <option value="">{t('inventory.optNoCategory')}</option>
                  {categories.map(c => <option key={c.category_id || c.category_code} value={c.category_id || c.category_code}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('inventory.addUnitLabel')}</label>
                <input value={addForm.unit} onChange={e => setAddForm(p => ({ ...p, unit: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('inventory.addCostLabel')}</label>
                <input type="number" step="0.01" value={addForm.cost_per_unit} onChange={e => setAddForm(p => ({ ...p, cost_per_unit: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>{t('inventory.addInitialStockLabel')}</label>
                <input type="number" value={addForm.quantity_on_hand} onChange={e => setAddForm(p => ({ ...p, quantity_on_hand: e.target.value }))} />
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
                <th>{t('inventory.colOrderStatus')}</th>
                <th>{t('inventory.colOrderAction')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{new Date(o.order_date).toLocaleDateString("th-TH")}</td>
                  <td>{o.supplier_name || "-"}</td>
                  <td>
                    <span className={`inv-badge ${String(o.order_status).toLowerCase() === 'received' ? 'received' : 'pending'}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td>
                    {String(o.order_status).toLowerCase() !== 'received' && (
                      <button className="qty-btn" onClick={() => handleUpdateOrderStatus(o.order_id, o.order_status)}>
                        {t('inventory.btnReceiveItem')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center" }}>{t('inventory.noOrders')}</td></tr>}
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
                  <td className="muted">
                    {t.notes} {t.reference_id ? `(#${t.reference_id})` : ''}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>{t('inventory.noTransactions')}</td></tr>}
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
                <select value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)} required>
                  <option value="">{t('inventory.optSelectSupplier')}</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                  ))}
                </select>
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
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end', marginBottom: 12, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemIngredient')}</label>
                      <select 
                        value={item.ingredient_id} 
                        onChange={e => handleUpdateOrderItem(index, 'ingredient_id', e.target.value)}
                        required
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      >
                        <option value="">{t('inventory.optSelect')}</option>
                        {ingredients.map(ig => (
                          <option key={ig.ingredient_id} value={ig.ingredient_id}>{ig.ingredient_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemQty', { unit: unit ? `(${unit})` : '' })}</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={e => handleUpdateOrderItem(index, 'quantity', e.target.value)}
                        required
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#6c757d' }}>{t('inventory.orderItemCost')}</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={item.unit_cost} 
                        onChange={e => handleUpdateOrderItem(index, 'unit_cost', e.target.value)}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>
                    <div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOrderItem(index)}
                        style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}
                      >
                        {t('inventory.btnDelete')}
                      </button>
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

    </div>
  );
}
