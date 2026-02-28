import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./OptionAdminPage.css";

export default function OptionAdminPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [groupName, setGroupName] = useState("");
  const [selectedMenus, setSelectedMenus] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, menusRes] = await Promise.all([
        api.get("/menu-options/groups"),
        api.get("/menu")
      ]);
      setGroups(groupsRes.data);
      setMenus(menusRes.data);
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!groupName.trim()) return;
    try {
      await api.post("/menu-options/groups", { 
        group_name: groupName,
        menu_ids: selectedMenus
      });
      setSuccess(t('optionAdmin.sucAddGroup'));
      setGroupName("");
      setSelectedMenus([]);
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm(t('optionAdmin.confirmDeleteGroup'))) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/groups/${id}`);
      setSuccess(t('optionAdmin.sucDeleteGroup'));
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const [itemForm, setItemForm] = useState({ group_id: "", item_name: "", additional_price: 0 });

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!itemForm.group_id || !itemForm.item_name) return;
    try {
      await api.post("/menu-options/items", {
        group_id: Number(itemForm.group_id),
        item_name: itemForm.item_name,
        additional_price: Number(itemForm.additional_price || 0)
      });
      setSuccess(t('optionAdmin.sucAddItem'));
      setItemForm({ ...itemForm, item_name: "", additional_price: 0 });
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleDeleteItem = async (id) => {
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/items/${id}`);
      setSuccess(t('optionAdmin.sucDeleteItem'));
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  if (loading) return <div className="page-pad">{t('optionAdmin.loading')}</div>;

  const handleMenuSelection = (menuId) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <div className="page-pad">
      <h2 style={{ marginBottom: 20 }}>{t('optionAdmin.pageTitle')}</h2>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* left col: Groups */}
        <div className="card" style={{ flex: 1, padding: 20 }}>
          <h3>{t('optionAdmin.titleGroups')}</h3>
          <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                placeholder={t('optionAdmin.placeholderGroupName')}
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
              />
              <button type="submit" className="pos-neworder-btn">{t('optionAdmin.btnAddGroup')}</button>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('optionAdmin.labelSelectMenus')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                {menus.map(m => (
                  <label key={m.menu_id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: selectedMenus.includes(m.menu_id) ? '#e6f4ea' : '#f5f5f5', padding: '4px 8px', borderRadius: 16, fontSize: 13 }}>
                    <input 
                      type="checkbox" 
                      checked={selectedMenus.includes(m.menu_id)}
                      onChange={() => handleMenuSelection(m.menu_id)}
                      style={{ margin: 0 }}
                    />
                    {m.menu_name}
                  </label>
                ))}
                {menus.length === 0 && <span style={{ color: '#999', fontSize: 13 }}>{t('optionAdmin.noMenusSelected')}</span>}
              </div>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map(g => (
              <div key={g.group_id} className="option-group-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <strong>{g.group_name}</strong>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {t('optionAdmin.textUsedFor')} {g.menu_ids?.length > 0 
                        ? g.menu_ids.map(id => menus.find(m => m.menu_id === id)?.menu_name || `#${id}`).join(', ')
                        : t('optionAdmin.textAllMenus')}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGroup(g.group_id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 4 }}>{t('optionAdmin.btnDeleteWord')}</button>
                </div>
                
                {/* Items in this group */}
                {g.menu_option_item && g.menu_option_item.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="inv-table" style={{ fontSize: 13, minWidth: 400 }}>
                    <thead>
                      <tr>
                        <th>{t('optionAdmin.colOptionName')}</th>
                        <th>{t('optionAdmin.colAddPrice')}</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.menu_option_item.map(it => (
                        <tr key={it.item_id}>
                          <td>{it.item_name}</td>
                          <td>+{it.additional_price} ฿</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleDeleteItem(it.item_id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: 16 }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#999' }}>{t('optionAdmin.noOptionItems')}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* right col: Items Form */}
        <div className="card" style={{ width: 350, padding: 20 }}>
          <h3>{t('optionAdmin.titleAddItem')}</h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>{t('optionAdmin.labelSelectGroup')}</label>
              <select value={itemForm.group_id} onChange={e => setItemForm({...itemForm, group_id: e.target.value})} required>
                <option value="">{t('optionAdmin.optSelect')}</option>
                {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>{t('optionAdmin.labelItemName')}</label>
              <input value={itemForm.item_name} onChange={e => setItemForm({...itemForm, item_name: e.target.value})} required placeholder={t('optionAdmin.placeholderItemName')} />
            </div>
            <div className="input-group">
              <label>{t('optionAdmin.labelAddPrice')}</label>
              <input type="number" step="0.5" value={itemForm.additional_price} onChange={e => setItemForm({...itemForm, additional_price: e.target.value})} />
            </div>
            <button type="submit" className="pos-neworder-btn">{t('optionAdmin.btnSaveItem')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
