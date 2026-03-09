import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { searchMember, createMember, getPointsHistory } from "../services/memberService";
import "../index.css";
import "./Members.css"; // Added new styles
import CustomSelect from "../components/CustomSelect";

import { UserPlus, Mars, Venus, CircleDashed, X, ClipboardList, Search } from 'lucide-react';

export default function Members() {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState([]);

  const [name, setName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [gender, setGender] = useState("MALE");

  const [historyModal, setHistoryModal] = useState({ open: false, member: null, history: [] });

  const loadMembers = async (searchPhone = "") => {
    try {
      const res = await searchMember(searchPhone);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMembers("");
  }, []);

  const handleSearch = async () => {
    loadMembers(phone);
  };

  const handleCreate = async () => {
    if (!name || !newPhone) {
      alert(t('members.alertRequireNamePhone'));
      return;
    }

    await createMember({ name, phone: newPhone, gender });
    alert(t('members.alertRegisterSuccess'));

    setName("");
    setNewPhone("");
    setGender("MALE");

    // Clear search phone state and reload all members so the newly added one is visible
    setPhone("");
    setShowAddModal(false);
    loadMembers("");
  };

  const handleViewHistory = async (member) => {
    try {
      const res = await getPointsHistory(member.member_id);
      setHistoryModal({ open: true, member, history: res.data });
    } catch (err) {
      console.error(err);
      alert(t('members.alertPointsHistoryFailed'));
    }
  };

  const formatDate = (dt) =>
    new Date(dt).toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="pos-page members-page" style={{ padding: 24, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900 }}>{t('members.title')}</h1>
            <p style={{ color: "#8b90a0", margin: 0 }}>
              {t('members.subtitle')}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} />
            {t('members.registerMember')}
          </button>
        </div>

        {/* Search */}
        <div className="card page-pad" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }}
              />
              <input
                placeholder={t('members.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  paddingLeft: 42,
                  paddingRight: 14,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 12,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-orange)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(237,100,45,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleSearch}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
            >
              <Search size={16} />
              {t('members.searchBtn')}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} />
            {t('members.memberList')}
          </h2>

          <div className="overflow-x-auto" style={{ border: "1px solid var(--border-color)", borderRadius: 8 }}>
            <table className="inv-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fc' }}>
                <tr>
                  <th>{t('members.colName')}</th>
                  <th className="center">{t('members.colPhone')}</th>
                  <th className="center">{t('members.colGender')}</th>
                  <th className="right">{t('members.colPoints')}</th>
                  <th className="center">{t('members.colAction')}</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan="5" className="center muted" style={{ textAlign: "center", padding: 20 }}>
                      {t('members.noMembersFound')}
                    </td>
                  </tr>
                )}

                {members.map((m) => (
                  <tr key={m.member_id}>
                    <td>{m.name}</td>
                    <td className="center" data-label={t('members.colPhone')} >{m.phone}</td>
                    <td className="center" data-label={t('members.colGender')}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        backgroundColor: m.gender === 'MALE' ? '#e3f2fd' : m.gender === 'FEMALE' ? '#fce4ec' : '#f5f5f5',
                        color: m.gender === 'MALE' ? '#1976d2' : m.gender === 'FEMALE' ? '#c2185b' : '#616161'
                      }}>
                        {m.gender === "MALE" ? <Mars size={13} /> : m.gender === "FEMALE" ? <Venus size={13} /> : <CircleDashed size={13} />}
                        {m.gender === "MALE" ? t('members.maleIcon') : m.gender === "FEMALE" ? t('members.femaleIcon') : t('members.otherIcon')}
                      </span>
                    </td>
                    <td className="right" data-label={t('members.colPoints')} style={{ fontWeight: 'bold', color: 'var(--primary-orange)', fontSize: 16 }}>{m.points}</td>
                    <td className="center" data-label={t('members.colAction')}>
                      <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }} onClick={() => handleViewHistory(m)}>{t('members.viewHistoryBtn')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {historyModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: 600, maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900 }}>{t('members.historyTitle', { name: historyModal.member?.name })}</h2>
              <button onClick={() => setHistoryModal({ open: false, member: null, history: [] })} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✖</button>
            </div>
            
            {historyModal.history.length === 0 ? (
              <p className="muted center">{t('members.noHistory')}</p>
            ) : (
              <table className="confirm-table">
                <thead className="confirm-head">
                  <tr>
                    <th>{t('members.historyColDate')}</th>
                    <th>{t('members.historyColType')}</th>
                    <th>{t('members.historyColRef')}</th>
                    <th className="right">{t('members.historyColPoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal.history.map(h => (
                    <tr key={h.transaction_id} className="confirm-row">
                      <td>{formatDate(h.transaction_date)}</td>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                          backgroundColor: h.points_change > 0 ? '#e6f4ea' : '#fce8e6',
                          color: h.points_change > 0 ? '#1e8e3e' : '#d93025'
                        }}>
                          {h.transaction_type === 'EARN' ? t('members.typeEarn') : t('members.typeSpend')}
                        </span>
                      </td>
                      <td className="muted">{h.sale?.receipt_number || h.notes || "-"}</td>
                      <td className="right" style={{ 
                        fontWeight: 'bold', 
                        color: h.points_change > 0 ? '#1e8e3e' : '#d93025'
                      }}>
                        {h.points_change > 0 ? `+${h.points_change}` : h.points_change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ width: 400, maxWidth: '90vw', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, margin: 0 }}>{t('members.registerMember')}</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ 
                  background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8
                }}
              >
                ✖
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#6C727F' }}>{t('members.colName')}</label>
                <input
                  style={{ width: '100%' }}
                  placeholder={t('members.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 100))}
                  maxLength={100}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#6C727F' }}>{t('members.colPhone')}</label>
                <input
                  style={{ width: '100%' }}
                  placeholder={t('members.phonePlaceholder')}
                  value={newPhone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#6C727F' }}>{t('members.colGender')}</label>
                <CustomSelect
                  value={gender}
                  onChange={(val) => setGender(val)}
                  options={[
                    { value: 'MALE', label: t('members.genderMale') },
                    { value: 'FEMALE', label: t('members.genderFemale') },
                    { value: 'OTHER', label: t('members.genderOther') },
                  ]}
                />
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleCreate}
              >
                {t('members.registerBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
