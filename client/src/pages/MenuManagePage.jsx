import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud } from "lucide-react";
import api from "../db/api";
import CustomSelect from "../components/CustomSelect";

// Block minus, e/E, + in numeric inputs
const blockInvalidNumKey = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/924/924514.png";

export default function MenuManagePage() {
  const { t } = useTranslation();
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... existing states ...

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
      setError(e?.response?.data?.message || t('menuManage.errLoadFailed'));
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

  const closeFormModal = () => {
    setIsModalOpen(false);
    resetForm();
    setError("");
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
        e?.response?.data?.message || e?.message || t('menuManage.errUploadFailed')
      );
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const name = form.menu_name.trim();
      const priceNum = Number(form.price);

      if (!name) return setError(t('menuManage.errNameEmpty'));
      if (!Number.isFinite(priceNum) || priceNum < 0)
        return setError(t('menuManage.errPriceInvalid'));

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
      closeFormModal();
    } catch (e2) {
      setError(e2?.response?.data?.message || t('menuManage.errSaveFailed'));
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
    setError("");
    setIsModalOpen(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this menu?'))) return;
    setError("");
    try {
      await api.delete(`/menu/${id}`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('menuManage.errDeleteFailed'));
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
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>{t('menuManage.pageTitle')}</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + {t('menuManage.formTitleAdd')}
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="auth-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>{t('menuManage.textLoading')}</div>
      ) : (
        <div className="menu-grid">
          {menus.map((m) => (
            <div key={m.menu_id} className="menu-card">
              <div className="menu-card-header">
                <img
                  src={m.image_url || FALLBACK_IMG}
                  alt={m.menu_name}
                  className="menu-card-img"
                />
                <div className="menu-card-info">
                  <div className="menu-card-title">{m.menu_name}</div>
                  <div className="menu-card-price">฿ {Number(m.price || 0).toFixed(2)}</div>
                  <div className="menu-card-meta">
                    {m.status || "-"} · {t('menuManage.textCategory')} {m.category_id ? categoryNameById.get(Number(m.category_id)) || `#${m.category_id}` : "-"}
                  </div>
                </div>
              </div>

              <div className="menu-card-actions">
                <button
                  className="menu-card-btn"
                  type="button"
                  onClick={() => onEdit(m)}
                >
                  {t('menuManage.btnEdit')}
                </button>
                <button
                  className="menu-card-btn delete"
                  type="button"
                  onClick={() => onDelete(m.menu_id)}
                >
                  {t('menuManage.btnDelete')}
                </button>
              </div>
            </div>
          ))}

          {menus.length === 0 && (
            <div style={{ color: "#9EA3AE", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
              {t('menuManage.noMenus')}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-x" onClick={closeFormModal}>
              ×
            </button>
            
            <div className="modal-title" style={{ marginBottom: 16 }}>
              {editingId ? t('menuManage.formTitleEdit') : t('menuManage.formTitleAdd')}
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="input-group">
                <label>{t('menuManage.labelName')}</label>
                <input
                  value={form.menu_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, menu_name: e.target.value }))
                  }
                  placeholder={t('menuManage.placeholderName')}
                  required
                />
              </div>

              <div className="input-group">
                <label>{t('menuManage.labelPrice')}</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  onKeyDown={blockInvalidNumKey}
                  placeholder={t('menuManage.placeholderPrice')}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="input-group">
                <label>{t('menuManage.labelStatus')}</label>
                <CustomSelect
                  value={form.status}
                  onChange={(val) => setForm((p) => ({ ...p, status: val }))}
                  options={[
                    { value: 'Available', label: 'Available' },
                    { value: 'Unavailable', label: 'Unavailable' },
                  ]}
                />
              </div>

              <div className="input-group">
                <label>{t('menuManage.labelCategory')}</label>
                <CustomSelect
                  value={String(form.category_id)}
                  onChange={(val) => setForm((p) => ({ ...p, category_id: val }))}
                  placeholder={t('menuManage.optNoCategory')}
                  options={[
                    { value: '', label: t('menuManage.optNoCategory') },
                    ...categoryOptions.map((c) => ({ value: String(c.category_id), label: c.label }))
                  ]}
                />
              </div>

              <div className="input-group">
                <label>{t('menuManage.labelImage')}</label>
                <div style={{ display: "flex", flexDirection: 'column', gap: 10 }}>

                  {/* Custom file upload zone */}
                  <div
                    onClick={() => document.getElementById('menu-file-input').click()}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: 12,
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'border-color 0.2s, background 0.2s',
                      background: '#fafafa',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-orange)';
                      e.currentTarget.style.background = '#FFF1EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = '#fafafa';
                    }}
                  >
                    <UploadCloud size={22} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        คลิกเพื่ออัปโหลดรูปภาพ
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        PNG, JPG, WEBP
                      </div>
                    </div>
                  </div>
                  <input
                    id="menu-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => onPickImage(e.target.files?.[0])}
                  />

                  <input
                    value={form.image_url}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, image_url: e.target.value }))
                    }
                    placeholder={t('menuManage.placeholderImageLink')}
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
                      {t('menuManage.textImagePreview')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-soft" onClick={closeFormModal}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? t('menuManage.btnUpdate') : t('menuManage.btnCreate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
