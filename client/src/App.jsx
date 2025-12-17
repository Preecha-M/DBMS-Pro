import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute, { RequireRole } from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AddEmployeePage from "./pages/AddEmployeePage";
import Navbar from "./components/Navbar";
import MenuPage from "./pages/MenuPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RequireRole roles={["Admin", "Manager"]} />}>
              <Route path="/employees/new" element={<AddEmployeePage />} />
            </Route>
            <Route path="/menu" element={<MenuPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
