import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { reportApi } from "../api/reportApi";
import { formatCurrency } from "../utils/formatters";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Pizza,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Database,
  ShieldCheck,
} from "lucide-react";
import ExportReportsSection from "../components/reports/ExportReportsSection";
import DatabaseBackupSection from "../components/reports/DatabaseBackupSection";

export const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "analytics"; // 'analytics' | 'export' | 'backup'

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [dateRangePreset, setDateRangePreset] = useState("today"); // 'today' | 'yesterday' | '7days' | '30days' | 'custom'
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  const [reportData, setReportData] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Preset date calculator
  const applyPreset = (preset) => {
    setDateRangePreset(preset);
    const now = new Date();
    const todayStr = getTodayStr();

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "7days") {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      setStartDate(past7.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 29);
      setStartDate(past30.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [salesRes, payRes] = await Promise.all([
        reportApi.getDailySalesReport({ startDate, endDate }),
        reportApi.getPaymentBreakdown({ startDate, endDate }),
      ]);

      if (salesRes.data) setReportData(salesRes.data);
      if (payRes.data) setPaymentBreakdown(payRes.data);
    } catch (err) {
      setError(err.message || "Failed to load sales analytics report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (currentTab === "analytics") {
      fetchReports();
    }
  }, [fetchReports, currentTab]);

  const sales = reportData?.sales || {};
  const orders = reportData?.orders || {};
  const bestSellers = reportData?.bestSellingItems || [];
  const collections = reportData?.collections || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">
              Reports, Export & Data Protection
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFC928]/30 text-[#92400E]">
              Financial Audit
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Verified financial collections, Excel/CSV audit downloads, and secure database backups
          </p>
        </div>

        {currentTab === "analytics" && (
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1 cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-[#E5E7EB] bg-white p-1.5 rounded-xl border shadow-xs">
        {[
          { id: "analytics", label: "Sales Analytics", icon: BarChart3 },
          { id: "export", label: "Export Reports (Excel & CSV)", icon: FileSpreadsheet },
          { id: "backup", label: "Database Backup & History", icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#D62828] text-white shadow-xs"
                  : "text-[#6B7280] hover:text-[#222222] hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: SALES ANALYTICS */}
      {currentTab === "analytics" && (
        <>
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Range Selector Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
            {/* Presets */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
              <Calendar className="w-4 h-4 text-[#6B7280] mr-1 shrink-0" />
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "7days", label: "Last 7 Days" },
                { id: "30days", label: "Last 30 Days" },
                { id: "custom", label: "Custom Dates" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    dateRangePreset === preset.id
                      ? "bg-[#D62828] text-white"
                      : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDateRangePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222]"
              />
              <span className="text-[#6B7280] font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDateRangePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222]"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D62828]" />
              Auditing orders and generating live financial metrics...
            </div>
          ) : (
            <>
              {/* Top Key Financial Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Net Sales */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Net Billed Sales
                    </span>
                    <span className="text-xl font-black text-[#222222] mt-0.5 block">
                      {formatCurrency(sales.totalSales || 0)}
                    </span>
                    <span className="text-[11px] text-[#6B7280] mt-0.5 block">
                      Gross: {formatCurrency(sales.grossSubtotal || 0)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#D62828]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* Collected Revenue */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Actual Collections
                    </span>
                    <span className="text-xl font-black text-[#16A34A] mt-0.5 block">
                      {formatCurrency(collections.totalCollected || 0)}
                    </span>
                    <span className="text-[11px] text-[#6B7280] mt-0.5 block">
                      {collections.transactionCount || 0} Transactions
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Total Orders
                    </span>
                    <span className="text-xl font-black text-[#222222] mt-0.5 block">
                      {sales.totalOrders || 0}
                    </span>
                    <span className="text-[11px] text-[#16A34A] mt-0.5 block font-bold">
                      {orders.completed || 0} completed
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                {/* Discounts & Tax */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Taxes / Discounts
                    </span>
                    <span className="text-base font-black text-[#222222] mt-0.5 block">
                      + {formatCurrency(sales.totalTax || 0)} Tax
                    </span>
                    <span className="text-[11px] text-[#DC2626] mt-0.5 block">
                      - {formatCurrency(sales.totalDiscount || 0)} Discount
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#6B7280]">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Collections Breakdown by Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-[#F0FDF4] text-[#16A34A] rounded-xl">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Cash Collected
                    </span>
                    <span className="text-lg font-black text-[#222222]">
                      {formatCurrency(paymentBreakdown?.cash?.totalAmount || 0)}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block">
                      {paymentBreakdown?.cash?.transactionCount || 0} Payments
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-[#EFF6FF] text-[#2563EB] rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      UPI / QR Collected
                    </span>
                    <span className="text-lg font-black text-[#222222]">
                      {formatCurrency(paymentBreakdown?.upi?.totalAmount || 0)}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block">
                      {paymentBreakdown?.upi?.transactionCount || 0} Payments
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-[#FAF5FF] text-[#9333EA] rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] font-bold uppercase tracking-wider block">
                      Card (POS Machine)
                    </span>
                    <span className="text-lg font-black text-[#222222]">
                      {formatCurrency(paymentBreakdown?.card?.totalAmount || 0)}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block">
                      {paymentBreakdown?.card?.transactionCount || 0} Payments
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Status Funnel & Best Sellers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Breakdown */}
                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-3">
                    <ShoppingBag className="w-4 h-4 text-[#D62828]" />
                    <h3 className="text-sm font-bold text-[#222222]">
                      Order Pipeline & Fulfillment Status
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-2.5 bg-[#F9FAFB] rounded-lg">
                      <span className="font-semibold text-[#222222]">Completed Orders</span>
                      <span className="font-black text-[#16A34A]">{orders.completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-[#F9FAFB] rounded-lg">
                      <span className="font-semibold text-[#222222]">In Kitchen / Pending</span>
                      <span className="font-black text-[#D97706]">{orders.pending || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-[#F9FAFB] rounded-lg">
                      <span className="font-semibold text-[#222222]">Paid Orders</span>
                      <span className="font-black text-[#16A34A]">{orders.paid || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-[#F9FAFB] rounded-lg">
                      <span className="font-semibold text-[#222222]">Partially Paid</span>
                      <span className="font-black text-[#D97706]">{orders.partiallyPaid || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-[#F9FAFB] rounded-lg">
                      <span className="font-semibold text-[#222222]">Unpaid Orders</span>
                      <span className="font-black text-[#DC2626]">{orders.unpaid || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Best Sellers */}
                <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-3">
                    <Pizza className="w-4 h-4 text-[#D62828]" />
                    <h3 className="text-sm font-bold text-[#222222]">
                      Top 10 Best-Selling Menu Items
                    </h3>
                  </div>

                  {bestSellers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 italic">
                      No sales data recorded for dishes in this period.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bestSellers.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-[#FFFDF8] rounded-lg border border-[#E5E7EB] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#FFC928] text-[#222222] font-black text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#222222] capitalize">
                              {item.itemName}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-[#222222]">
                              {item.quantitySold} Sold
                            </span>
                            <span className="text-[11px] text-[#6B7280] ml-2">
                              ({formatCurrency(item.salesAmount)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* TAB CONTENT 2: EXPORT REPORTS (EXCEL & CSV) */}
      {currentTab === "export" && <ExportReportsSection />}

      {/* TAB CONTENT 3: DATABASE BACKUP & HISTORY */}
      {currentTab === "backup" && <DatabaseBackupSection />}
    </div>
  );
};

export default ReportsPage;
