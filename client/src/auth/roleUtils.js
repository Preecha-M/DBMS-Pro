/**
 * ดึง role ที่ normalize แล้ว (ตัวพิมพ์เล็ก, ตัดช่องว่าง) สำหรับเปรียบเทียบแบบไม่สนใจตัวพิมพ์
 * @param {object} user - object ที่มี .role
 * @returns {string}
 */
export function getNormalizedRole(user) {
  const role = user?.role;
  if (role == null) return '';
  return String(role).trim().toLowerCase();
}

/**
 * ตรวจว่า user มี role อย่างน้อยหนึ่งใน allowedRoles หรือไม่ (ไม่สนใจตัวพิมพ์เล็กใหญ่)
 * @param {object} user
 * @param {string[]} allowedRoles - เช่น ['Admin', 'Owner', 'Manager']
 * @returns {boolean}
 */
export function hasAnyRole(user, allowedRoles) {
  const r = getNormalizedRole(user);
  if (!r) return false;
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
  const allowed = allowedRoles.map((a) => String(a).trim().toLowerCase());
  return allowed.includes(r);
}

/** Role ที่เห็นเมนูตั้งค่าและรายงาน (Admin, Owner, Manager) */
const SETTINGS_ROLES = ['admin', 'owner', 'manager'];

/**
 * ตรวจว่า user ระดับ Manager ขึ้นไป (เห็นเมนูตั้งค่า, สรุปรายได้ ฯลฯ)
 */
export function canSeeSettings(user) {
  return SETTINGS_ROLES.includes(getNormalizedRole(user));
}
