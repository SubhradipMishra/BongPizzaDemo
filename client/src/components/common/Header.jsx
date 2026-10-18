import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../store/slices/authSlice";
import { Popconfirm, Badge, Avatar } from "antd";
import { toast } from "react-toastify";
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
    try {
      await dispatch(logoutUser());
      toast.info("Logged out of BongPizza POS");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between no-print shadow-xs">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-[#222222] transition-colors focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/dashboard" className="flex items-center space-x-2.5 group !text-inherit">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img
              src="/images/logo.png"
              alt="বং Pizza"
              className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight !text-slate-900">
              বং <span className="!text-[#D62828]">Pizza</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 bg-[#FFC928]/25 !text-[#92400E] border border-[#FFC928]/40 text-[10px] font-black uppercase rounded-md tracking-wider">
              PRO POS
            </span>
          </div>
        </Link>

        {settings?.shopName && (
          <div className="hidden md:flex items-center text-xs text-[#6B7280] pl-3 border-l border-[#E5E7EB]">
            <Store className="w-3.5 h-3.5 mr-1.5 text-[#D62828]" />
            <span className="truncate max-w-[200px] font-medium text-[#374151]">
              {settings.shopName}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Live Clock */}
      <div className="hidden lg:flex items-center space-x-2.5 text-xs font-semibold text-[#4B5563] bg-[#FAFAFA] px-3.5 py-1.5 rounded-lg border border-[#E5E7EB]">
        <Clock className="w-3.5 h-3.5 text-[#D62828] animate-pulse" />
        <span>
          {currentTime.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-[#111827] font-mono font-bold tracking-tight">
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
          className="flex items-center space-x-1.5 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Biller Profile info */}
        <div className="flex items-center space-x-2.5 border-l border-[#E5E7EB] pl-3">
          <Badge dot status="success" offset={[-2, 28]}>
            <Avatar 
              size={32} 
              style={{ backgroundColor: '#FEF2F2', color: '#D62828', border: '1px solid #FECACA' }}
              icon={<User className="w-4 h-4 inline-block" />} 
            />
          </Badge>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#111827] leading-tight">
              {user?.username || "Biller"}
            </p>
            <p className="text-[10px] text-[#6B7280] font-medium leading-none mt-0.5">
              {user?.phoneNo ? `+91 ${user.phoneNo}` : "Counter Active"}
            </p>
          </div>
        </div>

        {/* Logout action with Popconfirm confirmation */}
        <Popconfirm
          title="Log out of POS?"
          description="Are you sure you want to log out of your billing session?"
          okText="Yes, Logout"
          cancelText="Stay"
          okButtonProps={{ danger: true }}
          onConfirm={handleLogout}
          placement="bottomRight"
        >
          <button
            type="button"
            className="p-2 text-[#6B7280] hover:text-[#D62828] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
            title="Logout from BongPizza"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </Popconfirm>
      </div>
    </header>
  );
};

export default Header;
