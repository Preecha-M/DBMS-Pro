import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import api from "../db/api";
import { User, ShieldAlert, ShieldCheck, ShieldHalf, UserCog } from "lucide-react";

// Today's date for max date validation
const todayStr = () => new Date().toISOString().split("T")[0];

const getRoleIcon = (role, size = 32) => {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return <ShieldAlert size={size} />;
  if (r === "owner") return <ShieldCheck size={size} />;
  if (r === "manager") return <ShieldHalf size={size} />;
  return <User size={size} />;
};

// Role hierarchy definition
// 4 = Admin, 3 = Owner, 2 = Manager, 1 = Staff
const roleLevel = (role) => {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return 4;
  if (r === "owner") return 3;
  if (r === "manager") return 2;
  return 1;
};

export default function EmployeeManagementPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    first_name_th: "",
    last_name_th: "",
    phone: "",
    birth_date: "",
    education: "",
    username: "",
    password: "",
    role: "Staff",
    status: "Active",
  });

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/employees");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setEmployees([]);
      setError(e?.response?.data?.message || t('addEmployee.errLoadFailed', 'Failed to load employees'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      first_name_th: "",
      last_name_th: "",
      phone: "",
      birth_date: "",
      education: "",
      username: "",
      password: "",
      role: "Staff",
      status: "Active",
    });
    setEditingId(null);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    resetForm();
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) {
      return setError(t('addEmployee.errMissingCredentials', 'Username is required'));
    }
    if (form.username.trim().length < 3) {
      return setError('Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
    }
    
    // Require password only on create
    if (!editingId && !form.password) {
       return setError(t('addEmployee.errMissingCredentials', 'Password is required'));
    }
    if (!editingId && form.password.length < 6) {
      return setError('Password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    try {
      const payload = {
        ...form,
        username: form.username.trim(),
        phone: form.phone?.trim() || null,
        birth_date: form.birth_date || null,
        education: form.education || null,
      };
      
      // Don't send empty password on update
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        await api.post("/employees", payload);
      }

      await load();
      closeFormModal();
    } catch (err) {
      setError(err?.response?.data?.message || t('addEmployee.errSaveFailed', 'Failed to save employee'));
    }
  };

  const onEdit = (emp) => {
    setEditingId(emp.employee_id);
    setForm({
      first_name_th: emp.first_name_th || "",
      last_name_th: emp.last_name_th || "",
      phone: emp.phone || "",
      birth_date: emp.birth_date ? emp.birth_date.split('T')[0] : "",
      education: emp.education || "",
      username: emp.username || "",
      password: "", // Leave blank for edit unless they want to change it
      role: emp.role || "Staff",
      status: emp.status || "Active",
    });
    setError("");
    setIsModalOpen(true);
  };

  const onDisable = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Resigned' : 'Active';
    const actionText = newStatus === 'Resigned' ? t('common.disable', 'disable') : t('common.enable', 'enable');
    
    if (!window.confirm(t('common.confirmAction', `Are you sure you want to ${actionText} this employee?`))) return;
    
    setError("");
    try {
      // If we're disabling, we call resign endpoint. If re-enabling, we call update.
      if (newStatus === 'Resigned') {
         await api.delete(`/employees/${id}`);
      } else {
         await api.put(`/employees/${id}`, { status: 'Active' });
      }
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('addEmployee.errActionFailed', 'Failed to change employee status'));
    }
  };

  const canModify = (targetEmp) => {
     if (!currentUser) return false;
     const currentLvl = roleLevel(currentUser.role);
     const targetLvl = roleLevel(targetEmp.role);
     
     // Admin can modify anyone
     if (currentLvl === 4) return true;
     
     // You can always modify yourself
     if (currentUser.employee_id === targetEmp.employee_id) return true;
     
     // Owner cannot modify Admin or other Owners
     if (currentLvl === 3) {
         if (targetLvl >= 3) return false;
         return true;
     }
     
     return false; // Manager/Staff shouldn't even be here, but just in case
  };

  const sorted = useMemo(() => {
    return [...employees].sort((a, b) => {
      // Sort by role level (highest first), then by ID
      const lvlA = roleLevel(a.role);
      const lvlB = roleLevel(b.role);
      if (lvlA !== lvlB) return lvlB - lvlA;
      return a.employee_id - b.employee_id;
    });
  }, [employees]);

  return (
    <div className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('addEmployee.pageTitle', 'Employee Management')}</h2>
        {roleLevel(currentUser?.role) >= 3 && (
          <button 
            className="btn-primary" 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            + {t('addEmployee.formTitleAdd', 'Add Employee')}
          </button>
        )}
      </div>

      {error && !isModalOpen && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div>{t('common.loading', 'Loading...')}</div>
      ) : (
        <div className="menu-grid">
          {sorted.map((emp) => {
            const modifiable = canModify(emp);
            
            return (
              <div key={emp.employee_id} className="menu-card" style={{ opacity: emp.status === 'Resigned' ? 0.6 : 1 }}>
                <div className="menu-card-header">
                  <div 
                    className="menu-card-img" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 32,
                      background: '#fff',
                      color: emp.status === 'Resigned' ? '#999' : 'var(--primary-blue)'
                    }}
                  >
                    {getRoleIcon(emp.role, 36)}
                  </div>
                  <div className="menu-card-info">
                    <div className="menu-card-title">{emp.username}</div>
                    <div className="menu-card-meta">
                      {emp.role} · {emp.first_name_th} {emp.last_name_th}
                      <br/>
                      <span style={{ color: emp.status === 'Active' ? 'green' : 'crimson', fontWeight: 'bold' }}>
                        {emp.status}
                      </span>
                      {currentUser?.employee_id === emp.employee_id && " (You)"}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20,
                    background: '#FFF1EB', color: 'var(--primary-orange)',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    🧾 {emp.total_sales ?? 0} บิล
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20,
                    background: '#EFF6FF', color: '#3B82F6',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    🕐 {emp.total_shifts ?? 0} กะ
                  </span>
                </div>

                <div className="menu-card-actions">
                  <button
                    className="menu-card-btn"
                    type="button"
                    onClick={() => onEdit(emp)}
                    disabled={!modifiable}
                    style={{ opacity: modifiable ? 1 : 0.5, cursor: modifiable ? 'pointer' : 'not-allowed' }}
                  >
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    className={`menu-card-btn ${emp.status === 'Active' ? 'delete' : ''}`}
                    type="button"
                    onClick={() => onDisable(emp.employee_id, emp.status)}
                    disabled={!modifiable || emp.employee_id === currentUser.employee_id}
                    style={{ 
                      opacity: (modifiable && emp.employee_id !== currentUser.employee_id) ? 1 : 0.5, 
                      cursor: (modifiable && emp.employee_id !== currentUser.employee_id) ? 'pointer' : 'not-allowed' 
                    }}
                  >
                    {emp.status === 'Active' ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
                  </button>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ color: "#9EA3AE", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
              {t('addEmployee.noEmployees', 'No employees found')}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: 600 }}>
            <button className="modal-x" onClick={closeFormModal}>
              ×
            </button>
            <div className="modal-title" style={{ marginBottom: 16 }}>
              {editingId ? t('addEmployee.formTitleEdit', 'Edit Employee') : t('addEmployee.formTitleAdd', 'Add Employee')}
            </div>
            
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4 }}>
                Account Info
              </div>
              
              <div className="input-group">
                <label>{t('addEmployee.labelUsername')}</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelPassword')} {editingId && "(Leave empty to keep)"}</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  minLength={!editingId ? 6 : undefined}
                  required={!editingId}
                />
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelRole')}</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelStatus')}</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4, marginTop: 12 }}>
                Personal Info
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelFirstNameTh')}</label>
                <input
                  name="first_name_th"
                  value={form.first_name_th}
                  onChange={(e) => setForm((p) => ({ ...p, first_name_th: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelLastNameTh')}</label>
                <input
                  name="last_name_th"
                  value={form.last_name_th}
                  onChange={(e) => setForm((p) => ({ ...p, last_name_th: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelPhone')}</label>
                <input
                  name="phone"
                  value={form.phone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                />
              </div>

              <div className="input-group">
                <label>{t('addEmployee.labelBirthDate')}</label>
                <input
                  name="birth_date"
                  type="date"
                  max={todayStr()}
                  value={form.birth_date}
                  onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }} className="input-group">
                <label>{t('addEmployee.labelEducation')}</label>
                <input
                  name="education"
                  value={form.education}
                  onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn-soft" onClick={closeFormModal}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? t('addEmployee.btnUpdate', 'Update') : t('addEmployee.btnSave', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
