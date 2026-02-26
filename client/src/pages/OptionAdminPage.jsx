import { useEffect, useState } from "react";
import api from "../db/api";
import "./OptionAdminPage.css";

export default function OptionAdminPage() {
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
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
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
      setSuccess("เพิ่มหน้าต่างตัวเลือกสำเร็จ");
      setGroupName("");
      setSelectedMenus([]);
      loadData();
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
      loadData();
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
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
    }
  };

  const handleDeleteItem = async (id) => {
    setError(""); setSuccess("");
    try {
      await api.delete(`/menu-options/items/${id}`);
      setSuccess("ลบตัวเลือกย่อยสำเร็จ");
      loadData();
    } catch (e) {
      setError(e?.response?.data?.message || "Error");
    }
  };

  if (loading) return <div className="page-pad">กำลังโหลด...</div>;

  const handleMenuSelection = (menuId) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <div className="page-pad">
      <h2 style={{ marginBottom: 20 }}>จัดการตัวเลือกเสริม (Menu Options)</h2>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* left col: Groups */}
        <div className="card" style={{ flex: 1, padding: 20 }}>
          <h3>หัวข้อตัวเลือก</h3>
          <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                placeholder="เช่น ระดับความหวาน, Toppings..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
              />
              <button type="submit" className="pos-neworder-btn">เพิ่มหัวข้อ</button>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>เลือกเมนูที่ใช้ต้วเลือกนี้:</label>
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
                {menus.length === 0 && <span style={{ color: '#999', fontSize: 13 }}>ไม่พบเมนู</span>}
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
                      ใช้กับ: {g.menu_ids?.length > 0 
                        ? g.menu_ids.map(id => menus.find(m => m.menu_id === id)?.menu_name || `#${id}`).join(', ')
                        : 'ทุกเมนู (ไม่ได้ระบุ)'}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGroup(g.group_id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 4 }}>ลบ</button>
                </div>
                
                {/* Items in this group */}
                {g.menu_option_item && g.menu_option_item.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="inv-table" style={{ fontSize: 13, minWidth: 400 }}>
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
                  </div>
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
