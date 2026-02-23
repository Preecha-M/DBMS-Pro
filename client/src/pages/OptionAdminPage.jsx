import { useEffect, useState } from "react";
import api from "../db/api";
import "./OptionAdminPage.css";

export default function OptionAdminPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [groupName, setGroupName] = useState("");

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/menu-options/groups");
      setGroups(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "โหลดกลุ่มตัวเลือกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!groupName.trim()) return;
    try {
      await api.post("/menu-options/groups", { group_name: groupName });
      setSuccess("เพิ่มหน้าต่างตัวเลือกสำเร็จ");
      setGroupName("");
      loadGroups();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("ต้องการลบกลุ่มตัวเลือกนี้และข้อมูลภายในทั้งหมด?")) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/groups/${id}`);
      setSuccess("ลบกลุ่มตัวเลือกสำเร็จ");
      loadGroups();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
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
      setSuccess("เพิ่มตัวเลือกสำเร็จ");
      setItemForm({ ...itemForm, item_name: "", additional_price: 0 });
      loadGroups();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
    }
  };

  const handleDeleteItem = async (id) => {
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/items/${id}`);
      setSuccess("ลบตัวเลือกย่อยสำเร็จ");
      loadGroups();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
    }
  };

  if (loading) return <div className="page-pad">กำลังโหลด...</div>;

  return (
    <div className="page-pad">
      <h2 style={{ marginBottom: 20 }}>จัดการตัวเลือกเสริม (Menu Options)</h2>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* left col: Groups */}
        <div className="card" style={{ flex: 1, padding: 20 }}>
          <h3>หัวข้อตัวเลือก</h3>
          <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input 
              placeholder="เช่น ระดับความหวาน, Toppings..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
            <button type="submit" className="pos-neworder-btn">เพิ่มหัวข้อ</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map(g => (
              <div key={g.group_id} className="option-group-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>{g.group_name}</strong>
                  <button onClick={() => handleDeleteGroup(g.group_id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>ลบ</button>
                </div>
                
                {/* Items in this group */}
                {g.menu_option_item && g.menu_option_item.length > 0 ? (
                  <table className="inv-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>ชื่อตัวเลือก</th>
                        <th>ราคาบวกเพิ่ม</th>
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
                ) : (
                  <div style={{ fontSize: 13, color: '#999' }}>ไม่มีตัวเลือกย่อย</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* right col: Items Form */}
        <div className="card" style={{ width: 350, padding: 20 }}>
          <h3>เพิ่มตัวเลือกย่อย</h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>เลือกหัวข้อ</label>
              <select value={itemForm.group_id} onChange={e => setItemForm({...itemForm, group_id: e.target.value})} required>
                <option value="">-- เลือก --</option>
                {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>ชื่อตัวเลือกย่อย</label>
              <input value={itemForm.item_name} onChange={e => setItemForm({...itemForm, item_name: e.target.value})} required placeholder="เช่น หวาน 50%" />
            </div>
            <div className="input-group">
              <label>ราคาบวกเพิ่ม (บาท)</label>
              <input type="number" step="0.5" value={itemForm.additional_price} onChange={e => setItemForm({...itemForm, additional_price: e.target.value})} />
            </div>
            <button type="submit" className="pos-neworder-btn">บันทึกตัวเลือกเพิ่ม</button>
          </form>
        </div>
      </div>
    </div>
  );
}
