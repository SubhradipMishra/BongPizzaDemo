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
        <div className="w-20 h-20 rounded-2xl bg-black border-2 border-amber-400/50 flex items-center justify-center p-1.5 mb-4 shadow-sm overflow-hidden animate-pulse">
          <img src="/images/logo.jpeg" alt="বং Pizza" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl font-black text-[#222222]">বং Pizza POS</h2>
        <p className="text-sm text-[#6B7280] mt-1">Verifying secure terminal session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
