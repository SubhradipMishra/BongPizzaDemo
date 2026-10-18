import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { orderApi } from "../api/orderApi";
import { tableApi } from "../api/tableApi";
import { formatCurrency, formatTimeOnly } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge";
import SettleModal from "../components/settlement/SettleModal";
import ReceiptModal from "../components/receipt/ReceiptModal";
import TrainingGuideTabs from "../components/dashboard/TrainingGuideTabs";
import {
  PlusCircle,
  Activity,
  ChefHat,
  Receipt,
  Grid,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  BookOpen,
} from "lucide-react";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "training" ? "training" : "operations";

  const { user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settlement & Receipt modals
  const [selectedOrderForSettle, setSelectedOrderForSettle] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        orderApi.getAllOrders(),
        tableApi.getAllTables(),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
      if (tablesRes.data) {
        setTables(tablesRes.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived statistics
  const activeOrders = orders.filter(
    (o) => o.orderStatus !== "completed" && o.orderStatus !== "cancelled"
  );
  const unpaidOrders = orders.filter(
    (o) => o.paymentStatus === "unpaid" || o.paymentStatus === "partially_paid"
  );
  const preparingOrders = orders.filter((o) => o.orderStatus === "preparing");
  const availableTables = tables.filter((t) => t.status === "available" && t.isActive !== false);

  // Today's total sales (completed & valid orders)
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(
    (o) =>
      o.createdAt &&
      o.createdAt.startsWith(today) &&
      o.orderStatus !== "cancelled"
  );
  const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.netAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#222222]">
              Welcome, {user?.username || "Biller"}!
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFC928]/30 text-[#92400E]">
              Terminal Active
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            {settings?.shopName || "BongPizza Restaurant"} — Live restaurant operations and billing
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/pos"
            className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#b91c1c] text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Order</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#D62828]" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setSearchParams({})}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "operations"
                ? "bg-[#D62828] text-white shadow-xs"
                : "text-[#6B7280] hover:text-[#222222] hover:bg-[#FAFAFA]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Operations</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: "training" })}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "training"
                ? "bg-[#D62828] text-white shadow-xs"
                : "text-[#6B7280] hover:text-[#222222] hover:bg-[#FAFAFA]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Staff Training Tabs</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                activeTab === "training"
                  ? "bg-white text-[#D62828]"
                  : "bg-[#FFC928] text-[#92400E]"
              }`}
            >
              Guide
            </span>
          </button>
        </div>

        <span className="text-[11px] text-[#6B7280] px-2 hidden md:inline">
          {activeTab === "training"
            ? "Interactive operational walkthrough & rules"
            : "Live terminal activity & floor status"}
        </span>
      </div>

      {activeTab === "training" ? (
        <TrainingGuideTabs />
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFC928]/25 flex items-center justify-center text-[#92400E]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#222222] mt-2">
            {formatCurrency(todaySales)}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-1">
            {todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""} placed today
          </p>
        </div>

        {/* Live Active Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Live Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#D62828]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#D62828] mt-2">
            {activeOrders.length}
          </p>
          <Link
            to="/live-orders"
            className="inline-flex items-center text-[11px] font-semibold text-[#D62828] hover:underline mt-1"
          >
            <span>View Live Orders</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Kitchen Preparing */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">In Kitchen (KOT)</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFEDD5] flex items-center justify-center text-[#9A3412]">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#9A3412] mt-2">
            {preparingOrders.length}
          </p>
          <Link
            to="/kot"
            className="inline-flex items-center text-[11px] font-semibold text-[#9A3412] hover:underline mt-1"
          >
            <span>Kitchen Display</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Available Tables */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Available Tables</span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center text-[#166534]">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#166534] mt-2">
            {availableTables.length} / {tables.length}
          </p>
          <Link
            to="/tables"
            className="inline-flex items-center text-[11px] font-semibold text-[#166534] hover:underline mt-1"
          >
            <span>Floor Plan</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Quick POS Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/pos"
          className="p-4 bg-white hover:bg-[#FFFDF8] border border-[#E5E7EB] hover:border-[#FFC928] rounded-xl flex items-center space-x-3 transition-colors shadow-xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FFC928]/25 flex items-center justify-center text-[#92400E]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#222222]">Billing POS</p>
            <p className="text-[11px] text-[#6B7280]">Punch new bill</p>
          </div>
        </Link>

        <Link
          to="/live-orders"
          className="p-4 bg-white hover:bg-[#FFFDF8] border border-[#E5E7EB] hover:border-[#D62828] rounded-xl flex items-center space-x-3 transition-colors shadow-xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#D62828]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#222222]">Settle Bills</p>
            <p className="text-[11px] text-[#6B7280]">
              {unpaidOrders.length} unpaid order{unpaidOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Link>

        <Link
          to="/kot"
          className="p-4 bg-white hover:bg-[#FFFDF8] border border-[#E5E7EB] hover:border-[#FFC928] rounded-xl flex items-center space-x-3 transition-colors shadow-xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FFEDD5] flex items-center justify-center text-[#9A3412]">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#222222]">Kitchen KOT</p>
            <p className="text-[11px] text-[#6B7280]">Manage orders</p>
          </div>
        </Link>

        <Link
          to="/receipts"
          className="p-4 bg-white hover:bg-[#FFFDF8] border border-[#E5E7EB] hover:border-[#FFC928] rounded-xl flex items-center space-x-3 transition-colors shadow-xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#374151]">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#222222]">Receipts</p>
            <p className="text-[11px] text-[#6B7280]">Thermal print</p>
          </div>
        </Link>
      </div>

      {/* Recent Live Orders Preview */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#D62828]" />
            <h2 className="text-base font-bold text-[#222222]">Active & Recent Orders</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]">
              {orders.slice(0, 5).length}
            </span>
          </div>

          <Link
            to="/live-orders"
            className="text-xs font-bold text-[#D62828] hover:underline flex items-center space-x-1"
          >
            <span>Go to Live Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading live orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#222222]">No orders placed yet</p>
            <p className="text-xs text-[#6B7280] mt-1">Start by creating the first customer order!</p>
            <Link
              to="/pos"
              className="mt-4 inline-flex items-center space-x-1.5 bg-[#D62828] text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Order</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Type / Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Kitchen</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {orders.slice(0, 6).map((order) => {
                  const isPaid = order.paymentStatus === "paid";
                  return (
                    <tr key={order._id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#222222]">
                        {order.orderNo}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280]">
                        {formatTimeOnly(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-[#222222]">
                          {order.orderType}
                        </span>
                        {order.tableId && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFC928]/25 text-[#92400E]">
                            Table {order.tableId.tableNumber || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#222222]">
                        {order.customer?.name || "Walk-in"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#222222]">
                        {formatCurrency(order.netAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="order" status={order.orderStatus} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="payment" status={order.paymentStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => setSelectedOrderForSettle(order)}
                            className="px-2.5 py-1 bg-[#D62828] hover:bg-[#b91c1c] text-white text-[11px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                          >
                            Settle
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="px-2 py-1 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#222222] text-[11px] font-semibold rounded transition-colors"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Settlement Modal */}
      {selectedOrderForSettle && (
        <SettleModal
          order={selectedOrderForSettle}
          onClose={() => setSelectedOrderForSettle(null)}
          onSuccess={() => {
            setSelectedOrderForSettle(null);
            loadDashboardData();
          }}
        />
      )}

      {/* Receipt Preview Modal */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
