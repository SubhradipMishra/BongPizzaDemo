import React, { useState, useEffect, useCallback, useMemo } from "react";
import { orderApi } from "../api/orderApi";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge";
import ReceiptModal from "../components/receipt/ReceiptModal";
import {
  History,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  AlertCircle,
  Eye,
  Filter,
} from "lucide-react";

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await orderApi.getAllOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNo?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q);

      if (!matchSearch) return false;

      if (orderStatusFilter !== "all" && o.orderStatus !== orderStatusFilter) {
        return false;
      }

      if (
        paymentStatusFilter !== "all" &&
        o.paymentStatus !== paymentStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">
              Order History & Archives
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]">
              {orders.length} Total Orders
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Complete historical record of all restaurant orders, fulfillments, and settlements
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors self-start sm:self-auto flex items-center space-x-1"
          title="Refresh History"
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Order Status Filter */}
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
          >
            <option value="all">Kitchen: All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
          >
            <option value="all">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order no, customer..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading order history...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-600">No Orders Found</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Adjust your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type / Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Net Amount</th>
                  <th className="py-3 px-4">Kitchen</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#FFFDF8] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#222222]">
                      {order.orderNo}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-[#222222]">
                        {order.orderType}
                      </span>
                      {order.tableId && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFC928]/30 text-[#92400E]">
                          Table {order.tableId.tableNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#222222]">
                        {order.customer?.name || "Walk-in"}
                      </p>
                      {order.customer?.phone && (
                        <p className="text-[10px] text-[#6B7280]">
                          {order.customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#222222]">
                      {order.totalItems} items
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#222222]">
                      {formatCurrency(order.netAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="order" status={order.orderStatus} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="payment" status={order.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrderReceipt(order)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-gray-100 text-[#222222] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#D62828]" />
                        <span>Receipt</span>
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
      {selectedOrderReceipt && (
        <ReceiptModal
          order={selectedOrderReceipt}
          onClose={() => setSelectedOrderReceipt(null)}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
