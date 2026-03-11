import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../db/api";
import CustomSelect from "../CustomSelect";
import { blockInvalidNumKey, sanitizeNumberInput } from "../../utils/bahtToText";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function AddIngredientTab({ categories, onRefresh, setError, setSuccess }) {
  const { t } = useTranslation();
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
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  return (
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
                const sanitized = sanitizeNumberInput(e.target.value, false);
                const v = parseInt(sanitized, 10);
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
  );
}
