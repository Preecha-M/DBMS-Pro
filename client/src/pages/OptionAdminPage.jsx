import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../db/api";
import "./OptionAdminPage.css";

const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

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

  // Edit state
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [isSingle, setIsSingle] = useState(false);

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
    
    // Append [SINGLE] suffix if isSingle is true
    const finalGroupName = isSingle ? `${groupName.trim()} [SINGLE]` : groupName.trim();
    
    try {
      const res = await api.post("/menu-options/groups", { 
        group_name: finalGroupName,
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
      setIsSingle(false);
      setSelectedMenus([]);
      setIsGroupModalOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || t('optionAdmin.errDefault'));
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!groupName.trim() || !editingGroupId) return;
    
    // Append [SINGLE] suffix if isSingle is true
    const finalGroupName = isSingle ? `${groupName.trim()} [SINGLE]` : groupName.trim();

    try {
      await api.put(`/menu-options/groups/${editingGroupId}`, {
        group_name: finalGroupName,
        menu_ids: selectedMenus
      });

      setGroups(prev => prev.map(g => {
        if (g.group_id === editingGroupId) {
          return { ...g, group_name: finalGroupName, menu_ids: [...selectedMenus] };
        }
        return g;
      }));

      setSuccess(t('optionAdmin.sucEditGroup'));
      setGroupName("");
      setIsSingle(false);
      setSelectedMenus([]);
      setEditingGroupId(null);
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

  const handleEditItem = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!editingItemId || !itemForm.item_name) return;
    try {
      await api.put(`/menu-options/items/${editingItemId}`, {
        item_name: itemForm.item_name,
        additional_price: Number(itemForm.additional_price || 0)
      });

      setGroups(prev => prev.map(g => ({
        ...g,
        menu_option_item: (g.menu_option_item || []).map(it => {
          if (it.item_id === editingItemId) {
            return { ...it, item_name: itemForm.item_name, additional_price: Number(itemForm.additional_price || 0) };
          }
          return it;
        })
      })));

      setSuccess(t('optionAdmin.sucEditItem'));
      setItemForm({ group_id: "", item_name: "", additional_price: 0 });
      setEditingItemId(null);
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

  const openEditGroupModal = (group) => {
    setError(""); setSuccess("");
    setEditingGroupId(group.group_id);
    
    // Check for suffix and strip it
    const hasSuffix = group.group_name.endsWith(' [SINGLE]');
    setGroupName(hasSuffix ? group.group_name.replace(' [SINGLE]', '') : group.group_name);
    setIsSingle(hasSuffix);
    
    setSelectedMenus(group.menu_ids || []);
    setIsGroupModalOpen(true);
  };

  const openAddGroupModal = () => {
    setError(""); setSuccess("");
    setEditingGroupId(null);
    setGroupName("");
    setIsSingle(false);
    setSelectedMenus([]);
    setIsGroupModalOpen(true);
  };

  const openEditItemModal = (item) => {
    setError(""); setSuccess("");
    setEditingItemId(item.item_id);
    setItemForm({ group_id: "", item_name: item.item_name, additional_price: item.additional_price });
    setIsItemModalOpen(true);
  };

  const openAddItemModal = (groupId = "") => {
    setError(""); setSuccess("");
    setEditingItemId(null);
    setItemForm({ group_id: String(groupId), item_name: "", additional_price: 0 });
    setIsItemModalOpen(true);
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
            onClick={() => openAddItemModal()}
          >
            + {t('optionAdmin.titleAddItem')}
          </button>
          <button 
            className="btn-primary" 
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => openAddGroupModal()}
          >
            + {t('optionAdmin.btnAddGroup')}
          </button>
        </div>
      </div>

      {error && !isGroupModalOpen && !isItemModalOpen && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && !isGroupModalOpen && !isItemModalOpen && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div className="menu-grid">
        {groups.map(g => {
          const isSingleGroup = g.group_name.endsWith(' [SINGLE]');
          const cleanGroupName = isSingleGroup ? g.group_name.replace(' [SINGLE]', '') : g.group_name;

          return (
          <div key={g.group_id} className="menu-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="menu-card-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {cleanGroupName}
                  <span style={{ 
                    fontSize: 11, padding: '2px 8px', borderRadius: 4, 
                    background: isSingleGroup ? '#FFF1EB' : '#F4F7FE', 
                    color: isSingleGroup ? 'var(--primary-orange)' : '#4B5563', 
                    fontWeight: 600, border: `1px solid ${isSingleGroup ? '#FFD8C4' : '#E5E7EB'}` 
                  }}>
                    {isSingleGroup ? t('options.badgeSingle', 'Single Choice') : t('options.badgeMulti', 'Multiple Choices')}
                  </span>
                </div>
                <div className="menu-card-meta">
                  {t('optionAdmin.textUsedFor')} {g.menu_ids?.length > 0 
                    ? g.menu_ids.map(id => menus.find(m => m.menu_id === id)?.menu_name || `#${id}`).join(', ')
                    : t('optionAdmin.textAllMenus')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: -4 }}>
                <button 
                  onClick={() => openEditGroupModal(g)} 
                  title={t('optionAdmin.btnEditGroup')}
                  style={{ 
                    background: 'transparent', border: 'none', color: '#6B7280', 
                    cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' 
                  }}
                >
                  <EditIcon size={15} />
                </button>
                <button 
                  onClick={() => handleDeleteGroup(g.group_id)} 
                  title={t('optionAdmin.btnDeleteWord')}
                  style={{ 
                    background: 'transparent', border: 'none', color: '#DC2626', 
                    cursor: 'pointer', fontSize: 18 
                  }}
                >
                  ×
                </button>
              </div>
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
                          onClick={() => openEditItemModal(it)} 
                          title={t('optionAdmin.btnEditItem')}
                          style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <EditIcon size={13} />
                        </button>
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
              onClick={() => openAddItemModal(g.group_id)}
            >
              + {t('optionAdmin.titleAddItem')}
            </button>
          </div>
        )})}
        {groups.length === 0 && (
          <div style={{ color: "#9EA3AE", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
            {t('optionAdmin.loading')}
          </div>
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {isGroupModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={() => { setIsGroupModalOpen(false); setEditingGroupId(null); }}>×</button>
            <div className="modal-title" style={{ marginBottom: 16 }}>
              {editingGroupId ? t('optionAdmin.btnEditGroup') : t('optionAdmin.btnAddGroup')}
            </div>
            
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={editingGroupId ? handleEditGroup : handleAddGroup}>
              <div className="input-group">
                <label>{t('optionAdmin.placeholderGroupName')}</label>
                <input 
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginTop: 16 }}>
                <label>{t('options.selectionType', 'Selection Type')}</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="selectionType" 
                      checked={!isSingle} 
                      onChange={() => setIsSingle(false)} 
                    />
                    {t('options.typeMulti', 'Multiple choices (Checkbox)')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="selectionType" 
                      checked={isSingle} 
                      onChange={() => setIsSingle(true)} 
                    />
                    {t('options.typeSingle', 'Single choice (Radio)')}
                  </label>
                </div>
              </div>
              
              <div className="input-group" style={{ marginTop: 16 }}>
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
                <button type="button" className="btn-soft" onClick={() => { setIsGroupModalOpen(false); setEditingGroupId(null); }}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingGroupId ? t('optionAdmin.btnSaveChanges') : t('optionAdmin.btnAddGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={() => { setIsItemModalOpen(false); setEditingItemId(null); }}>×</button>
            <div className="modal-title" style={{ marginBottom: 16 }}>
              {editingItemId ? t('optionAdmin.btnEditItem') : t('optionAdmin.titleAddItem')}
            </div>
            
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={editingItemId ? handleEditItem : handleAddItem}>
              {!editingItemId && (
                <div className="input-group">
                  <label>{t('optionAdmin.labelSelectGroup')}</label>
                  <select 
                    value={itemForm.group_id} 
                    onChange={e => setItemForm({...itemForm, group_id: e.target.value})} 
                    required
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-color)" }}
                  >
                    <option value="">{t('optionAdmin.optSelect')}</option>
                    {groups.map(g => {
                      const cleanName = g.group_name.endsWith(' [SINGLE]') ? g.group_name.replace(' [SINGLE]', '') : g.group_name;
                      return <option key={g.group_id} value={g.group_id}>{cleanName}</option>;
                    })}
                  </select>
                </div>
              )}
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
                <button type="button" className="btn-soft" onClick={() => { setIsItemModalOpen(false); setEditingItemId(null); }}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingItemId ? t('optionAdmin.btnSaveChanges') : t('optionAdmin.btnSaveItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
