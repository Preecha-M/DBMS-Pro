import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../db/api";

export default function CategoriesTab({ categories, onRefresh, setError, setSuccess }) {
  const { t } = useTranslation();
  const [catForm, setCatForm] = useState({ category_code: "", category_name: "", is_active: true });
  const [editingCatId, setEditingCatId] = useState(null);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!catForm.category_name) return setError(t('inventory.errDefault'));

    try {
      if (editingCatId) {
        await api.put(`/ingredients/categories/${editingCatId}`, catForm);
      } else {
        await api.post("/ingredients/categories", catForm);
      }
      setSuccess(t('inventory.sucAddCategory'));
      setCatForm({ category_code: "", category_name: "", is_active: true });
      setEditingCatId(null);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  const handleEditCategory = (c) => {
    setEditingCatId(c.category_code);
    setCatForm({ category_code: c.category_code, category_name: c.category_name, is_active: c.is_active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCategory = async (catCode) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this category?'))) return;
    try {
      await api.delete(`/ingredients/categories/${catCode}`);
      setSuccess(t('common.sucDelete', 'Deleted successfully'));
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="overflow-x-auto">
          <table className="inv-table">
            <thead>
              <tr>
                <th>{t('inventory.catCodeLabel')}</th>
                <th>{t('inventory.catNameLabel')}</th>
                <th>{t('inventory.catStatusLabel')}</th>
                <th style={{ minWidth: 120 }}>{t('inventory.colOrderAction', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.category_code}>
                  <td style={{ fontWeight: '600' }}>{c.category_code}</td>
                  <td>{c.category_name}</td>
                  <td>
                    <span className={`inv-badge ${c.is_active ? 'received' : 'pending'}`}>
                      {c.is_active ? t('inventory.catActive') : t('inventory.catInactive')}
                    </span>
                  </td>
                  <td>
                    <button className="btn-soft" onClick={() => handleEditCategory(c)} style={{ padding: '4px 10px', fontSize: 12, marginRight: 8 }}>
                      {t('inventory.btnEditCategory')}
                    </button>
                    <button className="btn-soft" onClick={() => handleDeleteCategory(c.category_code)} style={{ padding: '4px 10px', fontSize: 12, background: '#fee2e2', color: '#b91c1c' }}>
                      {t('inventory.btnDeleteCategory')}
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: 24, color: '#6b7280' }}>-</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card inv-form-container" style={{ padding: 24, position: 'sticky', top: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
          {editingCatId ? t('inventory.btnEditCategory') : t('inventory.tabCategories')}
        </h3>
        <form onSubmit={handleSaveCategory}>
          <div className="input-group">
            <label>{t('inventory.catCodeLabel')}</label>
            <input
              value={catForm.category_code}
              onChange={e => setCatForm(p => ({ ...p, category_code: e.target.value }))}
              disabled
              placeholder={editingCatId ? "" : "ระบบสร้างให้อัตโนมัติ (Auto)"}
            />
          </div>
          <div className="input-group">
            <label>{t('inventory.catNameLabel')}</label>
            <input
              value={catForm.category_name}
              onChange={e => setCatForm(p => ({ ...p, category_name: e.target.value }))}
              placeholder="เช่น เครื่องดื่ม"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={catForm.is_active}
              onChange={e => setCatForm(p => ({ ...p, is_active: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label style={{ margin: 0, cursor: 'pointer' }} onClick={() => setCatForm(p => ({ ...p, is_active: !p.is_active }))}>
              {t('inventory.catActive')}
            </label>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            {editingCatId && (
              <button type="button" className="btn-soft" style={{ flex: 1 }} onClick={() => {
                setEditingCatId(null);
                setCatForm({ category_code: "", category_name: "", is_active: true });
                setError("");
              }}>
                {t('inventory.btnCancel', 'Cancel')}
              </button>
            )}
            <button type="submit" className="pos-neworder-btn" style={{ flex: editingCatId ? 1 : 'none', width: editingCatId ? 'auto' : '100%' }}>
              {t('inventory.btnSaveCategory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
