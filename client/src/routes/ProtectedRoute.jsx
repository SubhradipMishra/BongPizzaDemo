import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { Pizza } from "lucide-react";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF8]">
        <div className="w-16 h-16 rounded-full bg-[#FFC928]/20 flex items-center justify-center mb-4">
          <Pizza className="w-8 h-8 text-[#D62828] animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-[#222222]">BongPizza POS</h2>
        <p className="text-sm text-[#6B7280] mt-1">Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
