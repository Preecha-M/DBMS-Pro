import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
    

  };

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between" }}>
      <div>POS</div>

      {user ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span>{user.username} ({user.role})</span>
          <button onClick={handleLogout} style={{ padding: "6px 10px", borderRadius: 10, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
