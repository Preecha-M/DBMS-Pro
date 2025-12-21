import { useEffect, useMemo, useState } from "react";
import api from "../db/api";

const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/924/924514.png";

export default function MenuManagePage() {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);

  const [catsRaw, setCatsRaw] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    menu_name: "",
    price: "",
    status: "Available",
    category_id: "",
    image_url: "",
  });

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.get("/menu"),
        api.get("/categories"),
      ]);

      setMenus(Array.isArray(mRes.data) ? mRes.data : []);
      setCatsRaw(cRes.data ?? null);
    } catch (e) {
      setMenus([]);
      setCatsRaw(null);
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryOptions = useMemo(() => {
    if (Array.isArray(catsRaw)) {
      return catsRaw
        .filter((c) => c && c.category_id != null)
        .map((c) => ({
          category_id: c.category_id,
          label: c.category_name ?? `#${c.category_id}`,
        }));
    }

    const main = Array.isArray(catsRaw?.main) ? catsRaw.main : [];
    const subsByMain = catsRaw?.subsByMain || {};

    const out = [];
    for (const m of main) {
      const subs = Array.isArray(subsByMain[String(m.category_id)])
        ? subsByMain[String(m.category_id)]
        : [];

      for (const s of subs) {
        out.push({
          category_id: s.category_id,
          label: `${m.category_name} > ${s.category_name}`,
        });
      }

      out.push({
        category_id: m.category_id,
        label: `${m.category_name} (Main)`,
      });
    }

    return out;
  }, [catsRaw]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    for (const opt of categoryOptions)
      map.set(Number(opt.category_id), opt.label);
    return map;
  }, [categoryOptions]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      menu_name: "",
      price: "",
      status: "Available",
      category_id: "",
      image_url: "",
    });
  };

  const onPickImage = async (file) => {
    if (!file) return;

    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await api.post("/upload/menu-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url;
      if (!url) throw new Error("No url returned");

      setForm((p) => ({ ...p, image_url: url }));
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "อัปโหลดรูปไม่สำเร็จ"
      );
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const name = form.menu_name.trim();
      const priceNum = Number(form.price);

      if (!name) return setError("กรอกชื่อเมนูก่อน");
      if (!Number.isFinite(priceNum) || priceNum < 0)
        return setError("ราคาต้องเป็นตัวเลข");

      const payload = {
        menu_name: name,
        price: priceNum,
        status: form.status || "Available",
        category_id: form.category_id ? Number(form.category_id) : null,
        image_url: form.image_url || null,
      };

      if (editingId) {
        await api.put(`/menu/${editingId}`, payload);
      } else {
        await api.post("/menu", payload);
      }

      await load();
      resetForm();
    } catch (e2) {
      setError(e2?.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const onEdit = (m) => {
    setEditingId(m.menu_id);
    setForm({
      menu_name: m.menu_name || "",
      price: String(m.price ?? ""),
      status: m.status || "Available",
      category_id: m.category_id ? String(m.category_id) : "",
      image_url: m.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    setError("");
    try {
      await api.delete(`/menu/${id}`);
      await load();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="page-pad">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>จัดการเมนู</h2>
        <button className="pos-logout-btn" onClick={resetForm}>
          Clear
        </button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 18,
          marginTop: 16,
        }}
      >
        <form onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>
            {editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
          </div>

          <div className="input-group">
            <label>ชื่อเมนู</label>
            <input
              value={form.menu_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, menu_name: e.target.value }))
              }
              placeholder="เช่น Iced Americano"
              required
            />
          </div>

          <div className="input-group">
            <label>ราคา</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="เช่น 45"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="input-group">
            <label>สถานะ</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div className="input-group">
            <label>หมวดหมู่</label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, category_id: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <option value="">— ไม่ระบุหมวด —</option>
              {categoryOptions.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>รูปเมนู</label>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />

              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, image_url: e.target.value }))
                }
                placeholder="หรือวางลิงก์รูป (optional)"
              />

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  src={form.image_url || FALLBACK_IMG}
                  alt="preview"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid var(--border-color)",
                    background: "#fff",
                  }}
                />
                <div style={{ color: "#9EA3AE", fontSize: 12 }}>
                  Preview รูปภาพ
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="pos-neworder-btn"
            style={{ marginTop: 14, width: "100%" }}
          >
            {editingId ? "Update" : "Create"}
          </button>
        </form>

        <div className="card" style={{ padding: 16, overflow: "hidden" }}>
          <div style={{ fontWeight: 900, marginBottom: 12 }}>รายการเมนู</div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {menus.map((m) => (
                <div key={m.menu_id} className="cat-row">
                  <div className="cat-left" style={{ alignItems: "center" }}>
                    <img
                      src={m.image_url || FALLBACK_IMG}
                      alt={m.menu_name}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        border: "1px solid var(--border-color)",
                        objectFit: "cover",
                        background: "#fff",
                      }}
                    />

                    <div>
                      <div className="cat-name">{m.menu_name}</div>
                      <div className="cat-sub">
                        ฿ {Number(m.price || 0).toFixed(2)} · {m.status || "-"}
                        {" · "}
                        หมวด:{" "}
                        {m.category_id
                          ? categoryNameById.get(Number(m.category_id)) ||
                            `#${m.category_id}`
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="cat-actions">
                    <button
                      className="qty-btn"
                      type="button"
                      onClick={() => onEdit(m)}
                    >
                      Edit
                    </button>
                    <button
                      className="qty-btn"
                      type="button"
                      onClick={() => onDelete(m.menu_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {menus.length === 0 && (
                <div style={{ color: "#9EA3AE" }}>ยังไม่มีเมนู</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
