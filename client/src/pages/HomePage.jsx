import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page-pad">
      <h2 style={{ marginTop: 0 }}>Home</h2>
      <p>หน้าแรกของระบบ POS</p>
      <button className="pos-neworder-btn" onClick={() => navigate("/new-order")}>
        New Order
      </button>
    </div>
  );
}
