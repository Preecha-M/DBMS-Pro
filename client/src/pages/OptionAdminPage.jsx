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

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ group_id: "", item_name: "", additional_price: 0 });

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [groupsRes, menusRes] = await Promise.all([
        api.get("/menu-options/groups"),
        api.get("/menu")
      ]);
      setGroups(groupsRes.data);
      setMenus(menusRes.data);
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errLoadFailed'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!groupName.trim()) return;
    try {
      const res = await api.post("/menu-options/groups", { 
        group_name: groupName,
        menu_ids: selectedMenus
      });
      
      const newGroup = {
        ...res.data,
        menu_ids: [...selectedMenus],
        menu_option_item: []
      };
      setGroups(prev => [...prev, newGroup]);
      
      setSuccess(t('optionAdmin.sucAddGroup'));
      setGroupName("");
      setSelectedMenus([]);
      setIsGroupModalOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm(t('optionAdmin.confirmDeleteGroup'))) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/groups/${id}`);
      setGroups(prev => prev.filter(g => g.group_id !== id));
      setSuccess(t('optionAdmin.sucDeleteGroup'));
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!itemForm.group_id || !itemForm.item_name) return;
    try {
      const res = await api.post("/menu-options/items", {
        group_id: Number(itemForm.group_id),
        item_name: itemForm.item_name,
        additional_price: Number(itemForm.additional_price || 0)
      });
      
      const newItem = res.data;
      setGroups(prev => prev.map(g => {
        if (g.group_id === Number(itemForm.group_id)) {
          return {
            ...g,
            menu_option_item: [...(g.menu_option_item || []), newItem]
          };
        }
        return g;
      }));
      
      setSuccess(t('optionAdmin.sucAddItem'));
      setItemForm({ ...itemForm, item_name: "", additional_price: 0 });
      setIsItemModalOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleDeleteItem = async (id) => {
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/items/${id}`);
      setGroups(prev => prev.map(g => ({
        ...g,
        menu_option_item: (g.menu_option_item || []).filter(item => item.item_id !== id)
      })));
      setSuccess(t('optionAdmin.sucDeleteItem'));
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleMenuSelection = (menuId) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  if (loading) return <div className="page-pad">{t('optionAdmin.loading')}</div>;

  return (
    <div className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{t('optionAdmin.pageTitle')}</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap' }}>
          <button 
            className="btn-soft" 
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              setError(""); setSuccess("");
              setItemForm({ group_id: "", item_name: "", additional_price: 0 });
              setIsItemModalOpen(true);
            }}
          >
            + {t('optionAdmin.titleAddItem')}
          </button>
          <button 
            className="btn-primary" 
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              setError(""); setSuccess("");
              setGroupName(""); setSelectedMenus([]);
              setIsGroupModalOpen(true);
            }}
          >
            + {t('optionAdmin.btnAddGroup')}
          </button>
        </div>
      </div>

      {error && !isGroupModalOpen && !isItemModalOpen && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && !isGroupModalOpen && !isItemModalOpen && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div className="menu-grid">
        {groups.map(g => (
          <div key={g.group_id} className="menu-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="menu-card-title" style={{ fontSize: 18 }}>{g.group_name}</div>
                <div className="menu-card-meta">
                  {t('optionAdmin.textUsedFor')} {g.menu_ids?.length > 0 
                    ? g.menu_ids.map(id => menus.find(m => m.menu_id === id)?.menu_name || `#${id}`).join(', ')
                    : t('optionAdmin.textAllMenus')}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteGroup(g.group_id)} 
                title={t('optionAdmin.btnDeleteWord')}
                style={{ 
                  background: 'transparent', border: 'none', color: '#DC2626', 
                  cursor: 'pointer', fontSize: 18, marginTop: -4 
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginTop: 12, background: '#F9FAFB', borderRadius: 12, padding: 12, flex: 1 }}>
              {g.menu_option_item && g.menu_option_item.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.menu_option_item.map(it => (
                    <div key={it.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <div style={{ fontWeight: 600, color: '#4B5563' }}>{it.item_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary-orange)' }}>+{it.additional_price} ฿</div>
                        <button 
                          onClick={() => handleDeleteItem(it.item_id)} 
                          style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
                          title="Delete Item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '10px 0' }}>{t('optionAdmin.noOptionItems')}</div>
              )}
            </div>

            <button
              className="menu-card-btn"
              style={{ marginTop: 12 }}
              onClick={() => {
                setError(""); setSuccess("");
                setItemForm({ group_id: String(g.group_id), item_name: "", additional_price: 0 });
                setIsItemModalOpen(true);
              }}
            >
              + {t('optionAdmin.titleAddItem')}
            </button>
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{ color: "#9EA3AE", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
            {t('optionAdmin.loading')}
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {isGroupModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={() => setIsGroupModalOpen(false)}>×</button>
            <div className="modal-title" style={{ marginBottom: 16 }}>{t('optionAdmin.btnAddGroup')}</div>
            
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleAddGroup}>
              <div className="input-group">
                <label>{t('optionAdmin.placeholderGroupName')}</label>
                <input 
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>{t('optionAdmin.labelSelectMenus')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto', padding: 12, border: '1px solid var(--border-color)', borderRadius: 12 }}>
                  {menus.map(m => (
                    <label key={m.menu_id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: selectedMenus.includes(m.menu_id) ? '#FFF1EB' : '#F4F7FE', color: selectedMenus.includes(m.menu_id) ? 'var(--primary-orange)' : 'inherit', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: selectedMenus.includes(m.menu_id) ? 700 : 500 }}>
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

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={() => setIsGroupModalOpen(false)}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('optionAdmin.btnAddGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={() => setIsItemModalOpen(false)}>×</button>
            <div className="modal-title" style={{ marginBottom: 16 }}>{t('optionAdmin.titleAddItem')}</div>
            
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleAddItem}>
              <div className="input-group">
                <label>{t('optionAdmin.labelSelectGroup')}</label>
                <select 
                  value={itemForm.group_id} 
                  onChange={e => setItemForm({...itemForm, group_id: e.target.value})} 
                  required
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-color)" }}
                >
                  <option value="">{t('optionAdmin.optSelect')}</option>
                  {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('optionAdmin.labelItemName')}</label>
                <input 
                  value={itemForm.item_name} 
                  onChange={e => setItemForm({...itemForm, item_name: e.target.value})} 
                  required 
                  placeholder={t('optionAdmin.placeholderItemName')} 
                />
              </div>
              <div className="input-group">
                <label>{t('optionAdmin.labelAddPrice')}</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={itemForm.additional_price} 
                  onChange={e => setItemForm({...itemForm, additional_price: e.target.value})} 
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={() => setIsItemModalOpen(false)}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('optionAdmin.btnSaveItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
