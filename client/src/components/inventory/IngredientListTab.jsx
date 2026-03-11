import { useTranslation } from "react-i18next";

const isExpired = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateString) < today;
};

export default function IngredientListTab({ ingredients, alerts }) {
  const { t } = useTranslation();

  return (
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
  );
}
