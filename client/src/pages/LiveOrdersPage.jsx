import React, { useState, useEffect, useCallback, useMemo } from "react";
import { orderApi } from "../api/orderApi";
import { formatCurrency, formatDateTime, formatTimeOnly } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge";
import SettleModal from "../components/settlement/SettleModal";
import ReceiptModal from "../components/receipt/ReceiptModal";
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  ChefHat,
  Receipt,
  MoreVertical,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
} from "lucide-react";

export const LiveOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'unpaid' | 'partially_paid' | 'paid' | 'all' | 'completed' | 'cancelled'
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Selected modals
  const [settleOrder, setSettleOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderApi.getAllOrders();
      if (response.data) {
        setOrders(response.data);
      }
      setError("");
    } catch (err) {
      setError(err.message || "Failed to fetch live orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Polling every 10 seconds if autoRefresh enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        order.orderNo?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.phone?.includes(query) ||
        (order.tableId?.tableNumber &&
          order.tableId.tableNumber.toLowerCase().includes(query));

      if (!matchSearch) return false;

      // 2. Tab filtering
      switch (activeTab) {
        case "active":
          return (
            order.orderStatus !== "completed" &&
            order.orderStatus !== "cancelled"
          );
        case "unpaid":
          return (
            order.paymentStatus === "unpaid" &&
            order.orderStatus !== "cancelled"
          );
        case "partially_paid":
          return order.paymentStatus === "partially_paid";
        case "paid":
          return order.paymentStatus === "paid";
        case "completed":
          return order.orderStatus === "completed";
        case "cancelled":
          return order.orderStatus === "cancelled";
        case "all":
        default:
          return true;
      }
    });
  }, [orders, searchQuery, activeTab]);

  // Handle status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      setStatusUpdateOrder(null);
      await fetchOrders();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await orderApi.cancelOrder(orderId);
      await fetchOrders();
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">Live Orders</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              {orders.filter((o) => o.orderStatus !== "completed" && o.orderStatus !== "cancelled").length} Active
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monitor real-time kitchen progress, payment settlement, and customer fulfillments
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
              autoRefresh
                ? "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-Refresh: {autoRefresh ? "ON (10s)" : "OFF"}</span>
          </button>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {[
              { id: "active", label: "Active Orders" },
              { id: "unpaid", label: "Unpaid" },
              { id: "partially_paid", label: "Partially Paid" },
              { id: "paid", label: "Paid" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
              { id: "all", label: "All Orders" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#D62828] text-white shadow-xs"
                    : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-[#FFFDF8]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order no, customer, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
            />
          </div>
        </div>
      </div>

      {/* Orders Table View */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading live orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600">No orders found</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              No orders matched the current filter criteria ({activeTab}).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order No</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Type / Table</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Net Amount</th>
                  <th className="py-3.5 px-4">Kitchen</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === "paid";
                  const isCancelled = order.orderStatus === "cancelled";
                  const isCompleted = order.orderStatus === "completed";

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-[#FFFDF8] transition-colors"
                    >
                      {/* Order No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#222222]">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="hover:text-[#D62828] hover:underline text-left cursor-pointer"
                        >
                          {order.orderNo}
                        </button>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                        {formatTimeOnly(order.createdAt)}
                      </td>

                      {/* Type & Table */}
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

                      {/* Customer */}
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

                      {/* Total items */}
                      <td className="py-3.5 px-4 text-[#222222] font-medium">
                        {order.totalItems} item{order.totalItems !== 1 ? "s" : ""}
                      </td>

                      {/* Net Amount */}
                      <td className="py-3.5 px-4 font-black text-[#222222]">
                        {formatCurrency(order.netAmount)}
                      </td>

                      {/* Kitchen Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge type="order" status={order.orderStatus} />
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge type="payment" status={order.paymentStatus} />
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Settle button */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => setSettleOrder(order)}
                            className="px-2.5 py-1 bg-[#D62828] hover:bg-[#b91c1c] text-white text-[11px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                            title="Settle bill payment"
                          >
                            Settle
                          </button>
                        )}

                        {/* Status update button */}
                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => setStatusUpdateOrder(order)}
                            className="px-2 py-1 bg-[#FFC928] hover:bg-[#eab308] text-[#222222] text-[11px] font-bold rounded transition-colors cursor-pointer"
                            title="Update Kitchen Status"
                          >
                            Status
                          </button>
                        )}

                        {/* Print Receipt button */}
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="px-2 py-1 bg-white border border-[#E5E7EB] hover:bg-gray-100 text-[#222222] text-[11px] font-semibold rounded transition-colors cursor-pointer"
                          title="Generate / Print Receipt"
                        >
                          Receipt
                        </button>

                        {/* Cancel button */}
                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="px-1.5 py-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Cancel Order"
                          >
                            <XCircle className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle Order Modal */}
      {settleOrder && (
        <SettleModal
          order={settleOrder}
          onClose={() => setSettleOrder(null)}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Status Update Modal */}
      {statusUpdateOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#E5E7EB] shadow-xl text-center space-y-4">
            <h3 className="text-base font-extrabold text-[#222222]">
              Update Order Status
            </h3>
            <p className="text-xs text-[#6B7280]">
              Current status: <span className="font-bold">{statusUpdateOrder.orderStatus}</span>
            </p>

            <div className="space-y-2 text-xs font-bold">
              {["confirmed", "preparing", "ready", "completed"].map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(statusUpdateOrder._id, st)}
                  className="w-full py-2.5 px-3 rounded-lg border border-[#E5E7EB] hover:bg-[#FFC928]/20 hover:border-[#FFC928] capitalize transition-colors cursor-pointer"
                >
                  Mark as {st}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setStatusUpdateOrder(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-black text-[#222222]">
                  Order Details — {selectedOrderDetails.orderNo}
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Created at: {formatDateTime(selectedOrderDetails.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Customer & Table */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FFFDF8] p-3 rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[#6B7280]">Customer:</span>
                <p className="font-bold text-[#222222]">
                  {selectedOrderDetails.customer?.name || "Walk-in"}
                </p>
                {selectedOrderDetails.customer?.phone && (
                  <p className="text-[11px] text-[#6B7280]">
                    {selectedOrderDetails.customer.phone}
                  </p>
                )}
              </div>
              <div>
                <span className="text-[#6B7280]">Order Type:</span>
                <p className="font-bold text-[#222222] capitalize">
                  {selectedOrderDetails.orderType}
                  {selectedOrderDetails.tableId && ` (Table ${selectedOrderDetails.tableId.tableNumber})`}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs divide-y divide-gray-100">
              {selectedOrderDetails.items?.map((it, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-bold">{formatCurrency(it.itemTotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-1 text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrderDetails.subtotal)}</span>
              </div>
              {selectedOrderDetails.discount > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedOrderDetails.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B7280]">
                <span>Tax:</span>
                <span>+{formatCurrency(selectedOrderDetails.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#D62828] pt-1 border-t border-dashed">
                <span>Net Amount:</span>
                <span>{formatCurrency(selectedOrderDetails.netAmount)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
              <button
                onClick={() => {
                  const o = selectedOrderDetails;
                  setSelectedOrderDetails(null);
                  setReceiptOrder(o);
                }}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-xs font-bold rounded-lg text-[#222222]"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-1.5 bg-[#222222] text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOrdersPage;
