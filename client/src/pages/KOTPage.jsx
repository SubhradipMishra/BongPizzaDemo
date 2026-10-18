import React, { useState, useEffect, useCallback } from "react";
import { kotApi } from "../api/kotApi";
import { formatTimeOnly, formatDateTime } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge";
import {
  ChefHat,
  RefreshCw,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  XCircle,
  Flame,
} from "lucide-react";

export const KOTPage = () => {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'preparing' | 'ready' | 'served'
  const [printingKOT, setPrintingKOT] = useState(null);

  const fetchKOTs = useCallback(async () => {
    try {
      const filter = statusFilter === "all" ? "" : statusFilter;
      const res = await kotApi.getAllKOTs(filter);
      if (res.data) {
        setKots(res.data);
      }
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load kitchen order tickets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchKOTs();
  }, [fetchKOTs]);

  // Polling for kitchen every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchKOTs();
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchKOTs]);

  const handleStatusChange = async (kotId, nextStatus) => {
    try {
      await kotApi.updateKOTStatus(kotId, nextStatus);
      await fetchKOTs();
    } catch (err) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  const handlePrintKOT = (kot) => {
    setPrintingKOT(kot);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs no-print">
        <div>
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">
              Kitchen Order Tickets (KOT)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]">
              Kitchen Display
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time kitchen display and preparation management
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg p-1 text-xs font-semibold">
            {[
              { id: "all", label: "All Tickets" },
              { id: "pending", label: "Pending" },
              { id: "preparing", label: "Preparing" },
              { id: "ready", label: "Ready" },
              { id: "served", label: "Served" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#D62828] text-white"
                    : "text-[#6B7280] hover:text-[#222222]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchKOTs}
            disabled={loading}
            className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B] no-print">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KOT Cards Grid */}
      {loading && kots.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280] no-print">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
          Loading kitchen tickets...
        </div>
      ) : kots.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280] no-print">
          <ChefHat className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-600">No Kitchen Tickets Found</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Tickets will appear here as soon as orders are sent to the kitchen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 no-print">
          {kots.map((kot) => {
            const isPending = kot.status === "pending";
            const isPreparing = kot.status === "preparing";
            const isReady = kot.status === "ready";
            const isServed = kot.status === "served";
            const isCancelled = kot.status === "cancelled";

            return (
              <div
                key={kot._id}
                className={`bg-white rounded-xl border flex flex-col justify-between shadow-xs transition-all ${
                  isPending
                    ? "border-amber-300 ring-1 ring-amber-300 bg-[#FFFDF8]"
                    : isPreparing
                    ? "border-orange-400 ring-1 ring-orange-400"
                    : isReady
                    ? "border-purple-300 bg-[#FAF5FF]"
                    : isServed
                    ? "border-green-200 opacity-80"
                    : "border-gray-200 opacity-60"
                }`}
              >
                {/* KOT Card Top Bar */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-[#222222]">
                        {kot.kotNo}
                      </span>
                      <StatusBadge type="kot" status={kot.status} />
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Order: <span className="font-bold">{kot.orderId?.orderNo || "—"}</span> •{" "}
                      {formatTimeOnly(kot.time || kot.createdAt)}
                    </p>
                  </div>

                  {/* Dine-In Table Badge */}
                  {kot.tableNumber ? (
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FFC928] text-[#222222] font-black text-xs shadow-xs">
                        Table {kot.tableNumber}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                      {kot.orderType}
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Ordered Dishes:
                  </p>
                  <div className="space-y-1.5 divide-y divide-gray-100 text-xs">
                    {kot.items?.map((it, idx) => (
                      <div key={idx} className="pt-1.5 flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <span className="font-black text-sm text-[#222222] capitalize">
                            {it.name}
                          </span>
                          {it.notes && (
                            <p className="text-[10px] text-[#D62828] font-bold italic mt-0.5">
                              Note: {it.notes}
                            </p>
                          )}
                        </div>
                        <span className="w-8 text-center text-sm font-black bg-[#FAFAFA] border border-[#E5E7EB] rounded py-0.5">
                          ×{it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {kot.notes && (
                    <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                      Chef Note: {kot.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="p-3 border-t border-gray-100 bg-[#FAFAFA] rounded-b-xl flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePrintKOT(kot)}
                    className="p-1.5 bg-white border border-[#E5E7EB] hover:bg-gray-100 rounded-lg text-[#222222] text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Print KOT Slip"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-600" />
                    <span>Print Slip</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {isPending && (
                      <button
                        onClick={() => handleStatusChange(kot._id, "preparing")}
                        className="px-3 py-1.5 bg-[#FFEDD5] hover:bg-[#fed7aa] text-[#9A3412] text-xs font-black rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleStatusChange(kot._id, "ready")}
                        className="px-3 py-1.5 bg-[#EDE9FE] hover:bg-[#ddd6fe] text-[#5B21B6] text-xs font-black rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleStatusChange(kot._id, "served")}
                        className="px-3 py-1.5 bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#166534] text-xs font-black rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Served</span>
                      </button>
                    )}

                    {!isServed && !isCancelled && (
                      <button
                        onClick={() => handleStatusChange(kot._id, "cancelled")}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Cancel KOT Ticket"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dedicated KOT Printable Slip (Visible only during window.print) */}
      {printingKOT && (
        <div className="hidden print-only text-black bg-white font-mono text-xs p-4 max-w-[80mm] mx-auto border-2 border-black">
          <div className="text-center border-b-2 border-black pb-2 mb-2">
            <h2 className="text-lg font-black uppercase tracking-wider">
              KITCHEN ORDER TICKET (KOT)
            </h2>
            <p className="text-sm font-black">
              {printingKOT.tableNumber
                ? `TABLE ${printingKOT.tableNumber}`
                : `ORDER: ${printingKOT.orderType?.toUpperCase()}`}
            </p>
          </div>

          <div className="space-y-1 text-xs border-b border-black pb-2 mb-2">
            <div className="flex justify-between">
              <span>KOT No:</span>
              <span className="font-bold">{printingKOT.kotNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Order No:</span>
              <span className="font-bold">{printingKOT.orderId?.orderNo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{formatDateTime(printingKOT.time || printingKOT.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-2 border-b-2 border-black pb-2 mb-2">
            <div className="flex justify-between font-bold border-b border-black pb-0.5">
              <span>ITEM</span>
              <span>QTY</span>
            </div>
            {printingKOT.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm font-black">
                <span className="flex-1 uppercase pr-2">{it.name}</span>
                <span className="text-base">×{it.quantity}</span>
              </div>
            ))}
          </div>

          {printingKOT.notes && (
            <div className="border border-black p-1 text-xs font-bold mb-2">
              NOTE: {printingKOT.notes}
            </div>
          )}

          <div className="text-center text-[10px] text-gray-700">
            — BONGPIZZA KITCHEN DISPLAY —
          </div>
        </div>
      )}
    </div>
  );
};

export default KOTPage;
