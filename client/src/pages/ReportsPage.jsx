import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

export const ReportsPage = () => {
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
    fetchReports();
  }, [fetchReports]);

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
              Sales Reports & Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFC928]/30 text-[#92400E]">
              Financial Audit
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Verified backend financial collections, order completions, and item velocity
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1"
          title="Refresh Report"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

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
        <div className="bg-white p-16 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
          Calculating financial reports...
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Net Sales */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-semibold text-[#6B7280]">Total Net Sales</span>
              <p className="text-xl sm:text-2xl font-black text-[#D62828] mt-1.5">
                {formatCurrency(sales.totalSales || 0)}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1">
                From {sales.totalOrders || 0} valid order{sales.totalOrders !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Total Money Collected */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-semibold text-[#166534]">
                Total Collected Cash/Tender
              </span>
              <p className="text-xl sm:text-2xl font-black text-[#166534] mt-1.5">
                {formatCurrency(collections.totalCollected || 0)}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1">
                {collections.transactionCount || 0} payment transaction{collections.transactionCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Total Tax (GST) */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-semibold text-[#6B7280]">Total GST Collected</span>
              <p className="text-xl sm:text-2xl font-black text-[#222222] mt-1.5">
                {formatCurrency(sales.totalTax || 0)}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1">
                CGST + SGST combined
              </p>
            </div>

            {/* Total Discount Given */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-semibold text-[#6B7280]">Total Discount Given</span>
              <p className="text-xl sm:text-2xl font-black text-[#92400E] mt-1.5">
                {formatCurrency(sales.totalDiscount || 0)}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1">
                Promotional & manual biller discounts
              </p>
            </div>
          </div>

          {/* Payment Method Collections Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
              <CreditCard className="w-4 h-4 text-[#D62828]" />
              <h3 className="font-extrabold text-sm text-[#222222]">
                Tender Collections by Payment Method
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cash */}
              <div className="bg-[#FFFDF8] p-4 rounded-xl border border-[#E5E7EB] flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#FFC928]/30 flex items-center justify-center text-[#92400E]">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">
                    Cash in Hand
                  </p>
                  <p className="text-lg font-black text-[#222222] mt-0.5">
                    {formatCurrency(paymentBreakdown?.cash?.totalAmount || 0)}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {paymentBreakdown?.cash?.transactionCount || 0} transaction{paymentBreakdown?.cash?.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* UPI */}
              <div className="bg-[#FFFDF8] p-4 rounded-xl border border-[#E5E7EB] flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#166534]">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">
                    UPI / QR Transfers
                  </p>
                  <p className="text-lg font-black text-[#222222] mt-0.5">
                    {formatCurrency(paymentBreakdown?.upi?.totalAmount || 0)}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {paymentBreakdown?.upi?.transactionCount || 0} transaction{paymentBreakdown?.upi?.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Card */}
              <div className="bg-[#FFFDF8] p-4 rounded-xl border border-[#E5E7EB] flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">
                    Card POS Terminal
                  </p>
                  <p className="text-lg font-black text-[#222222] mt-0.5">
                    {formatCurrency(paymentBreakdown?.card?.totalAmount || 0)}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {paymentBreakdown?.card?.transactionCount || 0} transaction{paymentBreakdown?.card?.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Status Distribution & Best Selling Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Fulfillment & Payment Distribution */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
                <Clock className="w-4 h-4 text-[#D62828]" />
                <h3 className="font-extrabold text-sm text-[#222222]">
                  Order Settlement & Status Distribution
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="font-semibold text-[#222222]">Completed Orders:</span>
                  <span className="font-black text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    {orders.completed || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="font-semibold text-[#222222]">In Kitchen / Pending:</span>
                  <span className="font-black text-[#9A3412] bg-[#FFEDD5] px-2 py-0.5 rounded">
                    {orders.pending || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="font-semibold text-[#222222]">Fully Paid Orders:</span>
                  <span className="font-black text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    {orders.paid || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="font-semibold text-[#222222]">Partially Paid Orders:</span>
                  <span className="font-black text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded">
                    {orders.partiallyPaid || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="font-semibold text-[#222222]">Unpaid Orders:</span>
                  <span className="font-black text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded">
                    {orders.unpaid || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Best-Selling Menu Items */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
                <Pizza className="w-4 h-4 text-[#D62828]" />
                <h3 className="font-extrabold text-sm text-[#222222]">
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
    </div>
  );
};

export default ReportsPage;
