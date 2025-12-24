import { Routes, Route, Navigate } from "react-router-dom";

import CategoriesPage from "../pages/CategoriesPage";
import MenuManagePage from "../pages/MenuManagePage";
import AddEmployeePage from "../pages/AddEmployeePage";
import NewOrderPage from "../pages/NewOrderPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import Registration from "../pages/Registration";

import ProtectedRoute from "../routes/ProtectedRoute";
import RequireRole from "../auth/RequireRole";

import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";

const AppRoute = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Registration />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/new-order" element={<NewOrderPage />} />
          <Route path="/settings/categories" element={<CategoriesPage />} />
          <Route path="/settings/menus" element={<MenuManagePage />} />
          
          <Route element={<RequireRole roles={["Admin"]} />}>
            <Route path="/employees/new" element={<AddEmployeePage />} />
            <Route path="/dashboard" element={<DashboardPage/>} />
          </Route>

          <Route path="/orders" element={<div className="page-pad">Orders (coming soon)</div>} />
          <Route path="/customers" element={<div className="page-pad">Customers (coming soon)</div>} />
          <Route path="/cashier" element={<div className="page-pad">Cashier (coming soon)</div>} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<div className="page-pad">404 Not Found</div>} />
    </Routes>
  )
}

export default AppRoute