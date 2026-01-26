import { useState } from "react";
import { searchMember, createMember } from "../services/memberService";
import "../index.css";

export default function Members() {
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState([]);

  const [name, setName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [gender, setGender] = useState("MALE");

  const handleSearch = async () => {
    if (!phone) return;
    const res = await searchMember(phone);
    setMembers(res.data);
  };

  const handleCreate = async () => {
    if (!name || !newPhone) {
      alert("กรุณากรอกชื่อและเบอร์โทร");
      return;
    }

    await createMember({ name, phone: newPhone, gender });
    alert("สมัครสมาชิกเรียบร้อย");

    setName("");
    setNewPhone("");
    setGender("MALE");

    const res = await searchMember(newPhone);
    setMembers(res.data);
  };

  return (
    <div className="page-content">
      <div className="page-pad">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>ระบบสมาชิก</h1>
          <p style={{ color: "#8b90a0", marginTop: 6 }}>
            ค้นหาและจัดการข้อมูลสมาชิก
          </p>
        </div>

        {/* Search + Register */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Search */}
          <div className="card page-pad">
            <h2 style={{ fontWeight: 900, marginBottom: 12 }}>
              🔍 ค้นหาสมาชิก
            </h2>

            <div style={{ display: "flex", gap: 12 }}>
              <input
                placeholder="เบอร์โทรศัพท์"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={handleSearch}>
                ค้นหา
              </button>
            </div>
          </div>

          {/* Register */}
          <div className="card page-pad">
            <h2 style={{ fontWeight: 900, marginBottom: 12 }}>
              ➕ สมัครสมาชิกใหม่
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <input
                placeholder="ชื่อลูกค้า"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                placeholder="เบอร์โทรศัพท์"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="MALE">ชาย</option>
                <option value="FEMALE">หญิง</option>
                <option value="OTHER">อื่น ๆ</option>
              </select>

              <button
                className="btn-primary"
                style={{ gridColumn: "span 2" }}
                onClick={handleCreate}
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="card page-pad">
          <h2 style={{ fontWeight: 900, marginBottom: 12 }}>
            📋 รายชื่อสมาชิก
          </h2>

          <table className="confirm-table">
            <thead className="confirm-head">
              <tr>
                <th>ชื่อ</th>
                <th className="center">เบอร์โทร</th>
                <th className="center">เพศ</th>
                <th className="right">แต้ม</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr className="confirm-row">
                  <td colSpan="4" className="center muted">
                    ไม่พบข้อมูลสมาชิก
                  </td>
                </tr>
              )}

              {members.map((m) => (
                <tr key={m.member_id} className="confirm-row">
                  <td>{m.name}</td>
                  <td className="center">{m.phone}</td>
                  <td className="center">
                    {m.gender === "MALE" && "👨 ชาย"}
                    {m.gender === "FEMALE" && "👩 หญิง"}
                    {m.gender === "OTHER" && "⚧ อื่น ๆ"}
                  </td>
                  <td className="right">{m.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
