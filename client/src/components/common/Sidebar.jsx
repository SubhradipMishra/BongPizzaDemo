import React from "react";
import { NavLink } from "react-router-dom";
import { Tag } from "antd";
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  History,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Grid,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";

export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/dashboard?tab=training",
      icon: BookOpen,
      label: "Staff Training",
      badge: "Guide",
      badgeColor: "gold",
    },
    {
      to: "/pos",
      icon: PlusCircle,
      label: "New Order",
      highlight: true,
    },
    {
      to: "/live-orders",
      icon: Activity,
      label: "Live Orders",
      badge: "Live",
      badgeColor: "red",
    },
    {
      to: "/orders",
      icon: History,
      label: "Order History",
    },
    {
      to: "/kot",
      icon: ChefHat,
      label: "Kitchen (KOT)",
      badge: "KDS",
      badgeColor: "orange",
    },
    {
      to: "/receipts",
      icon: Receipt,
      label: "Receipts",
    },
    {
      to: "/menu",
      icon: UtensilsCrossed,
      label: "Menu Items",
    },
    {
      to: "/tables",
      icon: Grid,
      label: "Tables & Floor",
    },
    {
      to: "/reports",
      icon: BarChart3,
      label: "Sales Reports",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } no-print shadow-xs`}
      >
        <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            POS Navigation
          </p>
          <span className="text-[10px] font-mono font-bold bg-[#FEF2F2] text-[#D62828] px-1.5 py-0.5 rounded border border-[#FECACA]">
            ONLINE
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "!bg-[#FEF2F2] !text-[#D62828] border border-[#FECACA] shadow-xs"
                      : "!text-slate-700 hover:!bg-[#F9FAFB] hover:!text-slate-900"
                  } ${item.highlight && !isActive ? "!text-[#D62828] font-bold" : ""}`
                }
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-lg ${item.highlight ? "bg-[#FEF2F2]" : ""}`}>
                    <Icon
                      className={`w-4 h-4 ${
                        item.highlight ? "!text-[#D62828]" : "!text-slate-500"
                      }`}
                    />
                  </div>
                  <span className="!text-inherit font-medium">{item.label}</span>
                </div>

                {item.badge && (
                  <Tag color={item.badgeColor || "default"} style={{ margin: 0, fontWeight: 700, fontSize: "10px", borderRadius: "10px", padding: "0 6px" }}>
                    {item.badge}
                  </Tag>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info in sidebar with blended transparent logo */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center space-x-2.5">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/images/logo.png" alt="বং Pizza" className="w-full h-full object-contain drop-shadow-xs" />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs !text-slate-900 m-0 leading-tight">বং Pizza POS</p>
            <p className="text-[11px] !text-slate-500 m-0 mt-0.5 truncate">A Touch of Bengal</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
