import React, { useState, useEffect, useCallback, useMemo } from "react";
import { receiptApi } from "../api/receiptApi";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import ReceiptModal from "../components/receipt/ReceiptModal";
import StatusBadge from "../components/common/StatusBadge";
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  AlertCircle,
  Eye,
} from "lucide-react";

export const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await receiptApi.getAllReceipts();
      if (res.data) {
        setReceipts(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load receipts list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.receiptNo?.toLowerCase().includes(q) ||
        r.orderNo?.toLowerCase().includes(q) ||
        r.customer?.name?.toLowerCase().includes(q) ||
        r.customer?.phone?.includes(q)
    );
  }, [receipts, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">
              Receipts & Tax Invoices
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]">
              {receipts.length} Generated
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Audit history of generated tax receipts with instant reprint capability
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt no, order no..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
            />
          </div>

          <button
            onClick={fetchReceipts}
            disabled={loading}
            className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors"
            title="Refresh Receipts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading && receipts.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading receipts archive...
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-600">No Receipts Generated Yet</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Receipts are created when billers click "Receipt" on settled or live orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer / Table</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredReceipts.map((r) => (
                  <tr key={r._id} className="hover:bg-[#FFFDF8] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#D62828]">
                      {r.receiptNo}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-[#222222]">
                      {r.orderNo}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {formatDateTime(r.issuedAt || r.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#222222]">
                        {r.customer?.name || "Walk-in Customer"}
                      </p>
                      {r.tableNumber && (
                        <p className="text-[10px] text-[#92400E] font-bold">
                          Table {r.tableNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#222222]">
                      {formatCurrency(r.netAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#16A34A]">
                      {formatCurrency(r.amountPaid)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="payment" status={r.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(r)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-white border border-[#E5E7EB] hover:bg-gray-100 text-[#222222] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#D62828]" />
                        <span>Preview & Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receiptId={selectedReceipt._id}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default ReceiptsPage;
