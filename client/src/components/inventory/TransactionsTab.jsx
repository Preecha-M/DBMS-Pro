import { useTranslation } from "react-i18next";

const formatDate = (dt) =>
  new Date(dt).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  });

export default function TransactionsTab({ transactions }) {
  const { t } = useTranslation();

  const getTypeBadge = (type) => {
    const isIn = type === 'IN' || type === 'RECEIVE_PO';
    return {
      backgroundColor: isIn ? '#e6f4ea' : '#fce8e6',
      color: isIn ? '#1e8e3e' : '#d93025',
    };
  };

  return (
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
              <th>{t('inventory.colTxEmployee', 'ผู้ทำรายการ')}</th>
              <th>{t('inventory.colTxNote')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.transaction_id}>
                <td>{formatDate(tx.transaction_date)}</td>
                <td>{tx.ingredient_id}</td>
                <td>{tx.ingredient?.ingredient_name || "-"}</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                    ...getTypeBadge(tx.transaction_type)
                  }}>
                    {tx.transaction_type}
                  </span>
                </td>
                <td style={{
                  fontWeight: 'bold',
                  color: tx.quantity > 0 ? '#1e8e3e' : '#d93025'
                }}>
                  {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.ingredient?.unit || ""}
                </td>
                <td>
                  {tx.employee ? (tx.employee.first_name_th ? `${tx.employee.first_name_th} ${tx.employee.last_name_th || ''}`.trim() : tx.employee.username) : "-"}
                </td>
                <td className="muted">
                  {tx.notes} {tx.reference_id ? `(${tx.reference_id})` : ''}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan="7" style={{ textAlign: "center" }}>{t('inventory.noTransactions')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
