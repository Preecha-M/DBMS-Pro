import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute, { RequireRole } from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AddEmployeePage from "./pages/AddEmployeePage";
import MenuPage from "./pages/MenuPage";
import Registration from "./pages/Registration";
import NewOrderPage from "./pages/NewOrderPage";
import POSLayout from "./components/POSLayout";
import HomePage from "./pages/HomePage";
import "./index.css";
import CategoriesPage from "./pages/CategoriesPage";
import MenuManagePage from "./pages/MenuManagePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Registration />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<POSLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/new-order" element={<NewOrderPage />} />
              <Route path="/settings/categories" element={<CategoriesPage />} />
              <Route path="/settings/menus" element={<MenuManagePage />} />
              <Route element={<RequireRole roles={["Admin", "Manager"]} />}>
                <Route path="/employees/new" element={<AddEmployeePage />} />
              </Route>

              <Route path="/orders" element={<div className="page-pad">Orders (coming soon)</div>} />
              <Route path="/customers" element={<div className="page-pad">Customers (coming soon)</div>} />
              <Route path="/cashier" element={<div className="page-pad">Cashier (coming soon)</div>} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<div className="page-pad">404</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
