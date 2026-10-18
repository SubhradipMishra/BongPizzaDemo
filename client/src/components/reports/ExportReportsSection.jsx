import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { reportApi } from "../../api/reportApi";
import { formatCurrency } from "../../utils/formatters";

export const ExportReportsSection = () => {
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [datePreset, setDatePreset] = useState("today");
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [format, setFormat] = useState("xlsx"); // "xlsx" | "csv"
  const [reportType, setReportType] = useState("sales"); // "sales" | "orders" | "payments"

  // Summary preview state
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Month selector helper
  const handleMonthSelect = (yearMonth) => {
    if (!yearMonth) return;
    const [year, month] = yearMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    setDatePreset("month");
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const applyPreset = (preset) => {
    setDatePreset(preset);
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
    } else if (preset === "thisMonth") {
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
      setStartDate(startStr);
      setEndDate(todayStr);
    }
  };

  // Fetch preview summary whenever dates change
  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await reportApi.getDailySalesReport({ startDate, endDate });
        if (active && res.data) {
          setPreviewData(res.data);
        }
      } catch (err) {
        if (active) setPreviewData(null);
      } finally {
        if (active) setLoadingPreview(false);
      }
    };

    fetchPreview();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast.warning("Please choose a valid start and end date.");
      return;
    }

    setDownloading(true);
    try {
      if (reportType === "sales") {
        await reportApi.exportSalesReport({ startDate, endDate, format });
      } else if (reportType === "orders") {
        await reportApi.exportOrders({ startDate, endDate, format });
      } else if (reportType === "payments") {
        await reportApi.exportPayments({ startDate, endDate, format });
      }

      toast.success(
        `Export downloaded successfully in ${format.toUpperCase()} format!`
      );
    } catch (err) {
      toast.error(err.message || "Failed to download export file.");
    } finally {
      setDownloading(false);
    }
  };

  const sales = previewData?.sales || {};
  const orders = previewData?.orders || {};
  const collections = previewData?.collections || {};
  const paymentMethods = collections?.paymentMethods || {};

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#222222] flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-[#D62828]" />
              <span>Export Sales & Financial Reports</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Download clean, verified Excel workbooks (.xlsx) or CSV files for accounting, tax audits, and records.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF2F2] text-[#D62828] border border-[#FECACA]">
              IST (Asia/Kolkata)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              Formula Safe
            </span>
          </div>
        </div>

        {/* Step 1: Select Report Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#222222] uppercase tracking-wider block">
            1. Select Report Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "sales",
                title: "Combined Sales Workbook",
                desc: "Summary, order details & collections in separate sheets",
                icon: Layers,
                recommended: true,
              },
              {
                id: "orders",
                title: "Order History Log",
                desc: "Items, table numbers, customer details, tax & status",
                icon: ShoppingBag,
              },
              {
                id: "payments",
                title: "Payment Transactions Log",
                desc: "Cash, UPI, Card, & split payment transactions",
                icon: CreditCard,
              },
            ].map((type) => {
              const Icon = type.icon;
              const isSelected = reportType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setReportType(type.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#FEF2F2] border-[#D62828] ring-1 ring-[#D62828]"
                      : "bg-white border-[#E5E7EB] hover:border-gray-300"
                  }`}
                >
                  {type.recommended && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#FFC928] text-[#78350F] text-[9px] font-black rounded uppercase">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? "bg-[#D62828] text-white" : "bg-[#FAFAFA] text-[#6B7280]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#222222]">{type.title}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{type.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date Range Picker & Quick Presets */}
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <label className="text-xs font-bold text-[#222222] uppercase tracking-wider block">
            2. Choose Reporting Period
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "thisMonth", label: "This Month" },
              { id: "custom", label: "Custom Dates" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  datePreset === p.id
                    ? "bg-[#D62828] text-white shadow-xs"
                    : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Quick Month Selector */}
            <div className="flex items-center space-x-1.5 ml-auto">
              <span className="text-[11px] font-bold text-[#6B7280]">Month:</span>
              <input
                type="month"
                onChange={(e) => handleMonthSelect(e.target.value)}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] cursor-pointer"
              />
            </div>
          </div>

          {/* Date range manual inputs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#6B7280] font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#6B7280] font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222]"
              />
            </div>
            <span className="text-[11px] text-[#6B7280] italic">
              Includes full business hours 00:00 to 23:59 IST.
            </span>
          </div>
        </div>

        {/* Step 3: Format & Download Action */}
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <label className="text-xs font-bold text-[#222222] uppercase tracking-wider block">
            3. File Format & Download
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Format choice */}
            <div className="flex items-center space-x-3">
              <label
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  format === "xlsx"
                    ? "bg-[#FEF2F2] border-[#D62828] text-[#D62828]"
                    : "bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="xlsx"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                  className="accent-[#D62828]"
                />
                <span>Excel Workbook (.xlsx)</span>
              </label>

              <label
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  format === "csv"
                    ? "bg-[#FEF2F2] border-[#D62828] text-[#D62828]"
                    : "bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="accent-[#D62828]"
                />
                <span>CSV File (.csv)</span>
              </label>
            </div>

            {/* Action Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2.5 bg-[#D62828] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
              <span>
                {downloading
                  ? "Generating File..."
                  : `Download ${format.toUpperCase()} Report`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Range Summary Preview Box */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#D62828]" />
            <h3 className="text-sm font-bold text-[#222222]">
              Live Period Summary Preview ({startDate} to {endDate})
            </h3>
          </div>
          {loadingPreview && (
            <span className="text-[11px] font-semibold text-[#D62828] animate-pulse">
              Calculating metrics...
            </span>
          )}
        </div>

        {sales.totalOrders === 0 ? (
          <div className="p-8 text-center bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB]">
            <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#222222]">No sales recorded for this date range</p>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Select another range or date to inspect orders and download records.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Total Orders</span>
              <span className="text-lg font-black text-[#222222]">{sales.totalOrders || 0}</span>
              <span className="text-[10px] text-[#16A34A] block mt-0.5">
                {orders.completed || 0} completed
              </span>
            </div>

            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Net Sales</span>
              <span className="text-lg font-black text-[#D62828]">
                {formatCurrency(sales.totalSales || 0)}
              </span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">
                Excludes cancelled orders
              </span>
            </div>

            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Revenue Collected</span>
              <span className="text-lg font-black text-[#16A34A]">
                {formatCurrency(collections.totalCollected || 0)}
              </span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">
                Completed payments
              </span>
            </div>

            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Payment Split</span>
              <div className="text-[11px] font-bold text-[#222222] space-y-0.5 mt-1">
                <span className="block text-[10px]">
                  Cash: {formatCurrency(paymentMethods.cash || 0)}
                </span>
                <span className="block text-[10px]">
                  UPI: {formatCurrency(paymentMethods.upi || 0)}
                </span>
                <span className="block text-[10px]">
                  Card: {formatCurrency(paymentMethods.card || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportReportsSection;
