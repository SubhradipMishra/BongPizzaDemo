import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../store/slices/authSlice";
import { 
  Pizza, 
  LogOut, 
  User, 
  Clock, 
  PlusCircle, 
  Store,
  Menu,
  X 
} from "lucide-react";

export const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between no-print">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md hover:bg-[#FAFAFA] text-[#222222] focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#FFC928] flex items-center justify-center shadow-xs">
            <Pizza className="w-5 h-5 text-[#D62828]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-[#222222]">
              Bong<span className="text-[#D62828]">Pizza</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.2 bg-[#FFC928]/30 text-[#92400E] text-[10px] font-bold uppercase rounded">
              POS
            </span>
          </div>
        </Link>

        {settings?.shopName && (
          <div className="hidden md:flex items-center text-xs text-[#6B7280] pl-3 border-l border-[#E5E7EB]">
            <Store className="w-3.5 h-3.5 mr-1 text-[#6B7280]" />
            <span className="truncate max-w-[200px]">{settings.shopName}</span>
          </div>
        )}
      </div>

      {/* Middle: Live Clock */}
      <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-[#6B7280] bg-[#FAFAFA] px-3 py-1.5 rounded-md border border-[#E5E7EB]">
        <Clock className="w-3.5 h-3.5 text-[#D62828]" />
        <span>
          {currentTime.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-[#222222] font-semibold">
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      {/* Right: Biller Details & Quick Actions */}
      <div className="flex items-center space-x-3">
        <Link
          to="/pos"
          className="flex items-center space-x-1.5 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Biller Profile info */}
        <div className="flex items-center space-x-2 border-l border-[#E5E7EB] pl-3">
          <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#222222]">
            <User className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#222222] leading-tight">
              {user?.username || "Biller"}
            </p>
            <p className="text-[10px] text-[#6B7280] leading-none mt-0.5">
              {user?.phoneNo || "Active"}
            </p>
          </div>
        </div>

        {/* Logout action */}
        <button
          onClick={handleLogout}
          className="p-1.5 text-[#6B7280] hover:text-[#D62828] hover:bg-[#FEF2F2] rounded-md transition-colors"
          title="Logout from BongPizza"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
