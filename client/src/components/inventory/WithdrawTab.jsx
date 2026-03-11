import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../db/api";
import CustomSelect from "../CustomSelect";
import PrintModal from "../print/PrintModal";
import WithdrawalDocument from "../print/WithdrawalDocument";
import { blockInvalidNumKey, sanitizeNumberInput } from "../../utils/bahtToText";

const isExpired = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateString) < today;
};

const formatDate = (dt) =>
  new Date(dt).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  });

export default function WithdrawTab({ ingredients, onRefresh, setError, setSuccess }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([{ ingredient_id: "", quantity: "" }]);
  const [notes, setNotes] = useState("");
  const [withdrawals, setWithdrawals] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [printData, setPrintData] = useState(null); // เปิด PrintModal

  const loadWithdrawals = async () => {
    try {
      const res = await api.get("/withdrawals");
      setWithdrawals(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const getSortedWithdrawableIngredients = () =>
    ingredients.map(ig => ({
      ...ig,
      total_unexpired: (ig.ingredient_batch || [])
        .filter(b => b.quantity_on_hand > 0 && !isExpired(b.expire_date))
        .reduce((sum, b) => sum + b.quantity_on_hand, 0),
    })).filter(ig => ig.total_unexpired > 0);

  const handleAddItem = () => setItems([...items, { ingredient_id: "", quantity: "" }]);

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const validItems = items.filter(it => it.ingredient_id && Number(it.quantity) > 0);
    if (validItems.length === 0) return setError(t('inventory.errWithdrawEmpty'));

    try {
      const res = await api.post("/withdrawals", {
        items: validItems.map(it => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity),
        })),
        notes: notes || undefined,
      });
      setSuccess(t('inventory.sucWithdraw'));
      setItems([{ ingredient_id: "", quantity: "" }]);
      setNotes("");
      onRefresh();
      loadWithdrawals();
      // เปิด print modal ทันทีหลังบันทึก
      setPrintData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || t('inventory.errDefault'));
    }
  };

  const withdrawable = getSortedWithdrawableIngredients();

  return (
    <div>
      {/* ======= FORM ======= */}
      <div className="card inv-form-container" style={{ padding: 24 }}>
        <form onSubmit={handleWithdraw}>
          {items.map((item, index) => {
            const selectedIg = ingredients.find(i => i.ingredient_id === item.ingredient_id);
            return (
              <div
                key={index}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12,
                  background: items.length > 1 ? '#f8f9fa' : 'transparent',
                  padding: items.length > 1 ? 12 : 0, borderRadius: 8,
                }}
              >
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 13 }}>{t('inventory.selectIngredientLabel')}</label>
                  <CustomSelect
                    value={item.ingredient_id}
                    onChange={(val) => handleUpdateItem(index, 'ingredient_id', val)}
                    placeholder={t('inventory.optSelectIngredient')}
                    options={[
                      { value: '', label: t('inventory.optSelectIngredient') },
                      ...withdrawable.map(ig => ({
                        value: String(ig.ingredient_id),
                        label: `${ig.ingredient_name} (${t('inventory.strRemaining')} ${ig.total_unexpired} ${ig.unit})`,
                      })),
                    ]}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13 }}>{t('inventory.withdrawQtyLabel')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number" min="1" step="1"
                      value={item.quantity}
                      onChange={e => {
                        const sanitized = sanitizeNumberInput(e.target.value, false);
                        const v = parseInt(sanitized, 10);
                        handleUpdateItem(index, 'quantity', isNaN(v) ? "" : String(Math.max(1, v)));
                      }}
                      onKeyDown={blockInvalidNumKey}
                      required
                      className="form-number-input"
                      style={{ flex: 1 }}
                    />
                    {selectedIg && (
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>
                        {selectedIg.unit || ""}
                      </span>
                    )}
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button" onClick={() => handleRemoveItem(index)}
                    style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, flexShrink: 0, fontFamily: 'inherit' }}
                  >
                    {t('inventory.btnDelete')}
                  </button>
                )}
              </div>
            );
          })}

          <button type="button" className="btn-soft" onClick={handleAddItem}
            style={{ marginBottom: 12, padding: '6px 14px', fontSize: 13 }}>
            {t('inventory.btnAddOrderItem')}
          </button>

          <div className="input-group" style={{ marginTop: 8 }}>
            <label>{t('inventory.wdNotesLabel', 'หมายเหตุ')}</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={t('inventory.wdNotesPlaceholder', 'เช่น เบิกใช้สำหรับวันนี้')} />
          </div>

          <button type="submit" className="pos-neworder-btn" style={{ width: "100%", marginTop: 12 }}>
            {t('inventory.btnConfirmWithdraw')}
          </button>
        </form>
      </div>

      {/* ======= WITHDRAWAL HISTORY ======= */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t('inventory.wdHistoryTitle', 'ประวัติการเบิก')}</h3>
          <button
            className="btn-soft"
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadWithdrawals(); }}
          >
            {showHistory ? t('inventory.wdHideHistory', 'ซ่อน') : t('inventory.wdShowHistory', 'แสดงประวัติ')}
          </button>
        </div>

        {showHistory && (
          <div className="card" style={{ padding: 24 }}>
            <div className="overflow-x-auto">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>{t('inventory.wdDocNumber', 'เลขที่เอกสาร')}</th>
                    <th>{t('inventory.colTxDate')}</th>
                    <th>{t('inventory.wdItems', 'รายการ')}</th>
                    <th>{t('inventory.colTxEmployee', 'ผู้เบิก')}</th>
                    <th>{t('inventory.colTxNote')}</th>
                    <th style={{ minWidth: 80 }}>พิมพ์</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(wd => (
                    <tr key={wd.withdrawal_id}>
                      <td style={{ fontWeight: 600 }}>{wd.wd_number}</td>
                      <td>{formatDate(wd.request_date)}</td>
                      <td>
                        {wd.withdrawal_request_item?.map((it, i) => (
                          <div key={i} style={{ fontSize: 13 }}>
                            {it.ingredient?.ingredient_name || it.ingredient_id} x {it.quantity} {it.ingredient?.unit || ""}
                          </div>
                        ))}
                      </td>
                      <td>
                        {wd.employee
                          ? (wd.employee.first_name_th
                            ? `${wd.employee.first_name_th} ${wd.employee.last_name_th || ''}`.trim()
                            : wd.employee.username)
                          : "-"}
                      </td>
                      <td className="muted">{wd.notes || "-"}</td>
                      <td>
                        <button
                          className="btn-soft"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setPrintData(wd)}
                        >
                          🖨 พิมพ์
                        </button>
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>-</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======= PRINT MODAL ======= */}
      {printData && (
        <PrintModal
          title={`ใบเบิกวัตถุดิบ — ${printData.wd_number || ''}`}
          onClose={() => setPrintData(null)}
        >
          <WithdrawalDocument withdrawal={printData} />
        </PrintModal>
      )}
    </div>
  );
}
