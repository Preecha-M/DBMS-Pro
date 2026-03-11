import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./InventoryPage.css";

import WithdrawTab from "../components/inventory/WithdrawTab";
import IngredientListTab from "../components/inventory/IngredientListTab";
import AddIngredientTab from "../components/inventory/AddIngredientTab";
import CategoriesTab from "../components/inventory/CategoriesTab";
import SuppliersTab from "../components/inventory/SuppliersTab";
import OrdersTab from "../components/inventory/OrdersTab";
import TransactionsTab from "../components/inventory/TransactionsTab";

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

  const loadIngredients = async () => {
    try { setIngredients((await api.get("/ingredients")).data); } catch (e) { console.error(e); }
  };
  const loadOrders = async () => {
    try { setOrders((await api.get("/orders")).data); } catch (e) { console.error(e); }
  };
  const loadCategories = async () => {
    try { setCategories((await api.get("/ingredients/categories")).data); } catch (e) { console.error(e); }
  };
  const loadSuppliers = async () => {
    try { setSuppliers((await api.get("/suppliers")).data); } catch (e) { console.error(e); }
  };
  const loadTransactions = async () => {
    try { setTransactions((await api.get("/ingredients/transactions")).data); } catch (e) { console.error(e); }
  };
  const loadAlerts = async () => {
    try {
      const data = (await api.get("/ingredients/alerts?days=7")).data;
      setAlerts([
        ...(Array.isArray(data?.expired) ? data.expired : []),
        ...(Array.isArray(data?.expiringSoon) ? data.expiringSoon : []),
      ]);
    } catch (e) { console.error(e); }
  };

  const refreshAll = () => {
    loadIngredients();
    loadOrders();
    loadCategories();
    loadSuppliers();
    loadTransactions();
    loadAlerts();
  };

  useEffect(() => {
    refreshAll();
  }, [tab]);

  const tabs = [
    { key: "withdraw",     label: t('inventory.tabWithdraw') },
    { key: "list",         label: t('inventory.tabList') },
    { key: "add",          label: t('inventory.tabAdd') },
    { key: "categories",   label: t('inventory.tabCategories') },
    { key: "suppliers",    label: t('inventory.tabAddSupplier') },
    { key: "orders",       label: t('inventory.tabOrders') },
    { key: "transactions", label: t('inventory.tabTransactions') },
  ];

  return (
    <div className="page-pad">
      <div className="inventory-desktop-wrapper">
        <h2 style={{ marginBottom: 20 }}>{t('inventory.pageTitle')}</h2>

        <div className="inventory-tabs">
          {tabs.map(tb => (
            <div key={tb.key}
              className={`inv-tab ${tab === tb.key ? "active" : ""}`}
              onClick={() => { setTab(tb.key); setError(""); setSuccess(""); }}>
              {tb.label}
            </div>
          ))}
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

        {tab === "withdraw" && (
          <WithdrawTab ingredients={ingredients} onRefresh={refreshAll} setError={setError} setSuccess={setSuccess} />
        )}
        {tab === "list" && (
          <IngredientListTab ingredients={ingredients} alerts={alerts} />
        )}
        {tab === "add" && (
          <AddIngredientTab categories={categories} onRefresh={refreshAll} setError={setError} setSuccess={setSuccess} />
        )}
        {tab === "categories" && (
          <CategoriesTab categories={categories} onRefresh={loadCategories} setError={setError} setSuccess={setSuccess} />
        )}
        {tab === "suppliers" && (
          <SuppliersTab suppliers={suppliers} onRefresh={loadSuppliers} setError={setError} setSuccess={setSuccess} />
        )}
        {tab === "orders" && (
          <OrdersTab orders={orders} />
        )}
        {tab === "transactions" && (
          <TransactionsTab transactions={transactions} />
        )}
      </div>
    </div>
  );
}
