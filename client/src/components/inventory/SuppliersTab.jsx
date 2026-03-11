import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../db/api";

export default function SuppliersTab({ suppliers, onRefresh, setError, setSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ supplier_name: "", contact: "" });
  const [editingId, setEditingId] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.supplier_name) return setError(t('inventory.errDefault'));

    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setSuccess(t('inventory.sucAddSupplier'));
      setForm({ supplier_name: "", contact: "" });
      setEditingId(null);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.supplier_id);
    setForm({ supplier_name: s.supplier_name || "", contact: s.contact || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure?'))) return;
    try {
      await api.delete(`/suppliers/${id}`);
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
                <th>ID</th>
                <th>{t('inventory.supNameLabel')}</th>
                <th>{t('inventory.supContactLabel')}</th>
                <th style={{ minWidth: 120 }}>{t('inventory.colOrderAction', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.supplier_id}>
                  <td style={{ fontWeight: '600' }}>#{s.supplier_id}</td>
                  <td>{s.supplier_name}</td>
                  <td>{s.contact || "-"}</td>
                  <td>
                    <button className="btn-soft" onClick={() => handleEdit(s)} style={{ padding: '4px 10px', fontSize: 12, marginRight: 8 }}>
                      {t('inventory.btnEditCategory')}
                    </button>
                    <button className="btn-soft" onClick={() => handleDelete(s.supplier_id)} style={{ padding: '4px 10px', fontSize: 12, background: '#fee2e2', color: '#b91c1c' }}>
                      {t('inventory.btnDeleteCategory')}
                    </button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: 24, color: '#6b7280' }}>-</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card inv-form-container" style={{ padding: 24, position: 'sticky', top: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
          {editingId ? t('inventory.supEditTitle', 'แก้ไขซัพพลายเออร์') : t('inventory.tabAddSupplier')}
        </h3>
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>{t('inventory.supNameLabel')}</label>
            <input value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label>{t('inventory.supContactLabel')}</label>
            <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            {editingId && (
              <button type="button" className="btn-soft" style={{ flex: 1 }} onClick={() => {
                setEditingId(null);
                setForm({ supplier_name: "", contact: "" });
                setError("");
              }}>
                {t('inventory.btnCancel', 'Cancel')}
              </button>
            )}
            <button type="submit" className="pos-neworder-btn" style={{ flex: editingId ? 1 : 'none', width: editingId ? 'auto' : '100%' }}>
              {t('inventory.btnSaveSupplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
