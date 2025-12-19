import { useAuth } from "../auth/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="navbar-container">
      <Link to="/menu" style={{ textDecoration: 'none' }}>
        <div className="navbar-logo">
          Easy<span>POS</span>
        </div>
      </Link>

      <div className="navbar-user-info">
        <div className="user-badge">
          {user.username} <span style={{ color: '#888', marginLeft: 5 }}>({user.role})</span>
        </div>
        
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}