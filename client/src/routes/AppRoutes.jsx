import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import POSLayout from "../layouts/POSLayout";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import NewOrderPage from "../pages/NewOrderPage";
import LiveOrdersPage from "../pages/LiveOrdersPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import KOTPage from "../pages/KOTPage";
import ReceiptsPage from "../pages/ReceiptsPage";
import MenuManagementPage from "../pages/MenuManagementPage";
import TableManagementPage from "../pages/TableManagementPage";
import ReportsPage from "../pages/ReportsPage";
import SettingsPage from "../pages/SettingsPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected POS Application */}
      <Route
        element={
          <ProtectedRoute>
            <POSLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<NewOrderPage />} />
        <Route path="/live-orders" element={<LiveOrdersPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/kot" element={<KOTPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/menu" element={<MenuManagementPage />} />
        <Route path="/tables" element={<TableManagementPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
