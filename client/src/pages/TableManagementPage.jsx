import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { tableApi } from "../api/tableApi";
import { formatCurrency, formatTimeOnly } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge";
import SettleModal from "../components/settlement/SettleModal";
import ReceiptModal from "../components/receipt/ReceiptModal";
import {
  Grid,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Users,
  Layers,
  CreditCard,
  Receipt,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export const TableManagementPage = () => {
  const navigate = useNavigate();
  const [tableGroups, setTableGroups] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'available' | 'occupied' | 'billed' | 'reserved'
  const [updatingTableId, setUpdatingTableId] = useState(null);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [settleOrder, setSettleOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Form states
  const [groupTitle, setGroupTitle] = useState("");
  const [groupNoOfTables, setGroupNoOfTables] = useState(4);
  const [groupDesc, setGroupDesc] = useState("");

  const [tableNumber, setTableNumber] = useState("");
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableGroupId, setTableGroupId] = useState("");

  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [groupsRes, tablesRes] = await Promise.all([
        tableApi.getTableGroups(),
        tableApi.getAllTables(),
      ]);

      if (groupsRes.data) setTableGroups(groupsRes.data);
      if (tablesRes.data) setTables(tablesRes.data);
      if (groupsRes.data?.length > 0 && !tableGroupId) {
        setTableGroupId(groupsRes.data[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load table configurations");
    } finally {
      setLoading(false);
    }
  }, [tableGroupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle manual / procedure table status change
  const handleUpdateStatus = async (tableId, newStatus) => {
    setUpdatingTableId(tableId);
    try {
      await tableApi.updateTableStatus(tableId, newStatus);
      // Optimistically update state
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingTableId(null);
    }
  };

  // Create Table Group
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    setFormSubmitting(true);
    try {
      await tableApi.createTableGroup({
        title: groupTitle.trim(),
        noOfTables: Number(groupNoOfTables) || 1,
        description: groupDesc.trim(),
      });
      setGroupTitle("");
      setGroupDesc("");
      setIsGroupModalOpen(false);
      await loadData();
    } catch (err) {
      alert(`Error creating group: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Create Table
  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim() || !tableGroupId) {
      alert("Please enter table number and select group.");
      return;
    }

    setFormSubmitting(true);
    try {
      await tableApi.createTable({
        tableNumber: tableNumber.trim(),
        tableGroupId,
        capacity: Number(tableCapacity) || 2,
      });
      setTableNumber("");
      setIsTableModalOpen(false);
      await loadData();
    } catch (err) {
      alert(`Error creating table: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (id, num) => {
    if (!window.confirm(`Delete table ${num}?`)) return;
    try {
      await tableApi.deleteTable(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Delete Table Group
  const handleDeleteGroup = async (id, title) => {
    if (
      !window.confirm(
        `Delete section "${title}"? This might impact tables assigned to it.`
      )
    )
      return;
    try {
      await tableApi.deleteTableGroup(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Derived statistics
  const statusCounts = useMemo(() => {
    const counts = {
      available: 0,
      occupied: 0,
      billed: 0,
      reserved: 0,
      total: tables.length,
    };
    tables.forEach((t) => {
      const st = (t.status || "available").toLowerCase();
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [tables]);

  // Filtered tables
  const filterMatches = (tbl) => {
    if (activeFilter === "all") return true;
    return (tbl.status || "available").toLowerCase() === activeFilter;
  };

  // Helper for table styling
  const getTableStyle = (status) => {
    switch ((status || "available").toLowerCase()) {
      case "available":
        return {
          bg: "bg-[#F0FDF4] border-emerald-400 hover:border-emerald-600 shadow-xs",
          badgeBg: "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]",
          titleColor: "text-emerald-950",
          accentColor: "text-emerald-700",
          statusText: "Available",
        };
      case "occupied":
        return {
          bg: "bg-[#FFF7ED] border-orange-400 hover:border-orange-600 shadow-xs",
          badgeBg: "bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]",
          titleColor: "text-orange-950",
          accentColor: "text-orange-700",
          statusText: "Occupied",
        };
      case "billed":
        return {
          bg: "bg-[#FEFCE8] border-yellow-400 hover:border-yellow-600 shadow-xs",
          badgeBg: "bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]",
          titleColor: "text-yellow-950",
          accentColor: "text-yellow-800",
          statusText: "Billed",
        };
      case "reserved":
        return {
          bg: "bg-[#F5F3FF] border-purple-400 hover:border-purple-600 shadow-xs",
          badgeBg: "bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]",
          titleColor: "text-purple-950",
          accentColor: "text-purple-700",
          statusText: "Reserved",
        };
      default:
        return {
          bg: "bg-white border-gray-200 hover:border-gray-400 shadow-xs",
          badgeBg: "bg-gray-100 text-gray-700 border border-gray-200",
          titleColor: "text-[#222222]",
          accentColor: "text-gray-600",
          statusText: status || "Unknown",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl sm:text-2xl font-black text-[#222222]">
              Table & Floor Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              {statusCounts.total} Tables Registered
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Real-time seating statuses, live order mapping, procedure move forward, and settlement
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#222222] text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#6B7280]" />
            <span>+ Table Group</span>
          </button>

          <button
            onClick={() => setIsTableModalOpen(true)}
            disabled={tableGroups.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dining Table</span>
          </button>
        </div>
      </div>

      {/* Status Metrics Bar & Color Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === "all"
              ? "bg-white border-[#222222] ring-2 ring-[#222222]/20 shadow-xs"
              : "bg-white border-[#E5E7EB] hover:border-gray-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase text-[#6B7280]">All Tables</p>
          <p className="text-xl font-black text-[#222222] mt-0.5">
            {statusCounts.total}
          </p>
        </button>

        <button
          onClick={() => setActiveFilter("available")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === "available"
              ? "bg-[#F0FDF4] border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-[#F0FDF4]/70 border-emerald-200 hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <p className="text-[10px] font-bold uppercase text-emerald-800">
              Available
            </p>
          </div>
          <p className="text-xl font-black text-emerald-700 mt-0.5">
            {statusCounts.available}
          </p>
        </button>

        <button
          onClick={() => setActiveFilter("occupied")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === "occupied"
              ? "bg-[#FFF7ED] border-orange-500 ring-2 ring-orange-500/20 shadow-xs"
              : "bg-[#FFF7ED]/70 border-orange-200 hover:border-orange-400"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <p className="text-[10px] font-bold uppercase text-orange-800">
              Occupied / Running
            </p>
          </div>
          <p className="text-xl font-black text-orange-700 mt-0.5">
            {statusCounts.occupied}
          </p>
        </button>

        <button
          onClick={() => setActiveFilter("billed")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === "billed"
              ? "bg-[#FEFCE8] border-yellow-500 ring-2 ring-yellow-500/20 shadow-xs"
              : "bg-[#FEFCE8]/70 border-yellow-200 hover:border-yellow-400"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <p className="text-[10px] font-bold uppercase text-yellow-800">
              Billed
            </p>
          </div>
          <p className="text-xl font-black text-yellow-700 mt-0.5">
            {statusCounts.billed}
          </p>
        </button>

        <button
          onClick={() => setActiveFilter("reserved")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === "reserved"
              ? "bg-[#F5F3FF] border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
              : "bg-[#F5F3FF]/70 border-purple-200 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <p className="text-[10px] font-bold uppercase text-purple-800">
              Reserved
            </p>
          </div>
          <p className="text-xl font-black text-purple-700 mt-0.5">
            {statusCounts.reserved}
          </p>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Groups and Interactive Table Grid */}
      {loading && tableGroups.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
          Loading table sections and live seating status...
        </div>
      ) : tableGroups.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
          <Grid className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-600">No Table Sections Defined</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Create a table section (e.g. Ground Floor Dining, Terrace, Family AC Hall) to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tableGroups.map((group) => {
            const groupTables = tables
              .filter(
                (t) =>
                  (typeof t.tableGroupId === "object"
                    ? t.tableGroupId?._id
                    : t.tableGroupId) === group._id
              )
              .filter(filterMatches);

            return (
              <div
                key={group._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden"
              >
                {/* Group Header */}
                <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-[#222222]">
                        {group.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-[#E5E7EB] text-[#6B7280]">
                        {groupTables.length} Tables Active
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteGroup(group._id, group.title)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tables Grid */}
                <div className="p-5">
                  {groupTables.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-6 text-center">
                      No tables matching filter in this section.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {groupTables.map((tbl) => {
                        const style = getTableStyle(tbl.status);
                        const isUpdating = updatingTableId === tbl._id;
                        const activeOrd = tbl.activeOrder;

                        return (
                          <div
                            key={tbl._id}
                            onDoubleClick={() => {
                              if (activeOrd) {
                                setReceiptOrder(activeOrd);
                              } else {
                                navigate(`/pos?tableId=${tbl._id}&tableNumber=${encodeURIComponent(tbl.tableNumber)}`);
                              }
                            }}
                            title={
                              activeOrd
                                ? `Double-click to open Order #${activeOrd.orderNo}`
                                : `Double-click to start new order for Table ${tbl.tableNumber}`
                            }
                            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative group cursor-pointer hover:shadow-md hover:scale-[1.01] ${style.bg}`}
                          >
                            {/* Delete Table Button */}
                            <button
                              onClick={() =>
                                handleDeleteTable(tbl._id, tbl.tableNumber)
                              }
                              className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                              title="Delete Table"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Table Info Header */}
                            <div>
                              <div className="flex items-start justify-between pr-5">
                                <div>
                                  <p className={`font-black text-xl ${style.titleColor}`}>
                                    {tbl.tableNumber}
                                  </p>
                                  <p className="text-[11px] text-[#6B7280] flex items-center mt-0.5">
                                    <Users className="w-3.5 h-3.5 mr-1 text-[#6B7280]" />
                                    <span>{tbl.capacity} Seats</span>
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${style.badgeBg}`}
                                >
                                  {style.statusText}
                                </span>
                              </div>

                              {/* Active Order Details Banner */}
                              {activeOrd ? (
                                <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-black/5 text-xs space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-mono font-bold text-[#D62828]">
                                      {activeOrd.orderNo}
                                    </span>
                                    <span className="font-bold capitalize text-gray-500">
                                      {activeOrd.orderStatus}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">
                                      {activeOrd.totalItems} items
                                    </span>
                                    <span className="font-black text-[#222222]">
                                      {formatCurrency(activeOrd.netAmount)}
                                    </span>
                                  </div>

                                  {/* Quick Settle and Receipt buttons */}
                                  <div className="pt-1.5 flex items-center space-x-1.5 border-t border-gray-100">
                                    <button
                                      onClick={() => setSettleOrder(activeOrd)}
                                      className="flex-1 py-1 px-2 bg-[#D62828] hover:bg-[#b91c1c] text-white font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      <span>Settle</span>
                                    </button>
                                    <button
                                      onClick={() => setReceiptOrder(activeOrd)}
                                      className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-[#222222] font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                      title="Print Receipt"
                                    >
                                      <Receipt className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 py-2 text-[11px] text-gray-400 italic">
                                  No active order running
                                </div>
                              )}
                            </div>

                            {/* Procedure Move Forward / Manual Status Controller */}
                            <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#6B7280] uppercase">
                                Procedure Status:
                              </span>

                              <div className="relative">
                                <select
                                  disabled={isUpdating}
                                  value={(tbl.status || "available").toLowerCase()}
                                  onChange={(e) =>
                                    handleUpdateStatus(tbl._id, e.target.value)
                                  }
                                  className="text-[10px] font-extrabold uppercase px-2 py-1 bg-white border border-gray-300 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#D62828] cursor-pointer"
                                >
                                  <option value="available">Available (Free)</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="billed">Billed</option>
                                  <option value="reserved">Reserved</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-extrabold text-[#222222]">
                New Table Section
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor, Balcony Terrace, Family AC Hall"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Expected No. of Tables
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={groupNoOfTables}
                  onChange={(e) => setGroupNoOfTables(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Description / Features (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Central Air Conditioning, Garden View, 4-seater booths"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-[#D62828] text-white font-bold rounded-lg cursor-pointer"
                >
                  {formSubmitting ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dining Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-extrabold text-[#222222]">
                Add Dining Table
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-01, T-02, Bar-1, VIP-04"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Section / Group *
                </label>
                <select
                  required
                  value={tableGroupId}
                  onChange={(e) => setTableGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                >
                  {tableGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Seating Capacity (Persons) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-[#D62828] text-white font-bold rounded-lg cursor-pointer"
                >
                  {formSubmitting ? "Adding..." : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Settle Modal */}
      {settleOrder && (
        <SettleModal
          order={settleOrder}
          onClose={() => setSettleOrder(null)}
          onSuccess={() => {
            setSettleOrder(null);
            loadData();
          }}
        />
      )}

      {/* Embedded Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default TableManagementPage;
