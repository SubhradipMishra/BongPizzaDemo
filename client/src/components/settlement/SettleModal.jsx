import React, { useState, useEffect, useCallback } from "react";
import { paymentApi } from "../../api/paymentApi";
import { orderApi } from "../../api/orderApi";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import StatusBadge from "../common/StatusBadge";
import ReceiptModal from "../receipt/ReceiptModal";
import {
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Receipt,
  Clock,
  History,
  Layers,
  FileText,
  HelpCircle,
  Percent,
} from "lucide-react";

export const SettleModal = ({ order, onClose, onSuccess }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Payment form inputs: 'cash' | 'upi' | 'card' | 'part' | 'due' | 'other'
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  // Multi-tender split states for 'part' payment mode
  const [partCash, setPartCash] = useState("");
  const [partCard, setPartCard] = useState("");
  const [partUpi, setPartUpi] = useState("");
  const [partDue, setPartDue] = useState("");
  const [partSubMethod, setPartSubMethod] = useState("cash"); // if single partial amount mode

  // Receipt modal trigger
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Authoritative balance calculations from backend
  const netAmount = Number(currentOrder?.netAmount) || 0;

  const paidAmount = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const roundedPaid = Math.round(paidAmount * 100) / 100;
  const remainingBalance = Math.max(0, Math.round((netAmount - roundedPaid) * 100) / 100);
  const isFullyPaid = remainingBalance <= 0;

  // Split calculation
  const totalSplitTendered = Math.round(
    ((Number(partCash) || 0) +
      (Number(partCard) || 0) +
      (Number(partUpi) || 0) +
      (Number(partDue) || 0)) *
      100
  ) / 100;

  const splitRemainingToAllocate = Math.max(
    0,
    Math.round((remainingBalance - totalSplitTendered) * 100) / 100
  );

  // Fetch authoritative payments & fresh order data from backend
  const loadOrderAndPayments = useCallback(async () => {
    if (!order?._id) return;
    setLoading(true);
    setError("");
    try {
      const [orderRes, paymentsRes] = await Promise.all([
        orderApi.getOrderById(order._id),
        paymentApi.getPaymentsByOrder(order._id),
      ]);

      if (orderRes.data) {
        setCurrentOrder(orderRes.data);
      }
      if (paymentsRes.data?.payments) {
        setPayments(paymentsRes.data.payments);
      }
    } catch (err) {
      setError(err.message || "Failed to load order payment details");
    } finally {
      setLoading(false);
    }
  }, [order?._id]);

  useEffect(() => {
    loadOrderAndPayments();
  }, [loadOrderAndPayments]);

  // Set default payment amount to remaining balance when balance changes
  useEffect(() => {
    if (remainingBalance > 0) {
      setAmount(remainingBalance.toString());
    } else {
      setAmount("");
    }
  }, [remainingBalance]);

  // Helper to autofill remaining into a specific tender in split mode
  const autoFillSplit = (targetTender) => {
    const currentOthers =
      totalSplitTendered -
      (targetTender === "cash"
        ? Number(partCash) || 0
        : targetTender === "card"
        ? Number(partCard) || 0
        : targetTender === "upi"
        ? Number(partUpi) || 0
        : Number(partDue) || 0);

    const needed = Math.max(0, Math.round((remainingBalance - currentOthers) * 100) / 100);

    if (targetTender === "cash") setPartCash(needed > 0 ? needed.toString() : "");
    if (targetTender === "card") setPartCard(needed > 0 ? needed.toString() : "");
    if (targetTender === "upi") setPartUpi(needed > 0 ? needed.toString() : "");
    if (targetTender === "due") setPartDue(needed > 0 ? needed.toString() : "");
  };

  // Record payment handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    setSubmitting(true);

    try {
      let payload = {
        orderId: currentOrder._id,
      };

      if (method === "part") {
        // Multi-tender split or partial payment
        const splits = [];
        if (Number(partCash) > 0) {
          splits.push({ method: "cash", amount: Number(partCash) });
        }
        if (Number(partCard) > 0) {
          splits.push({
            method: "card",
            amount: Number(partCard),
            transactionReference: transactionRef || "Card Auth",
          });
        }
        if (Number(partUpi) > 0) {
          splits.push({
            method: "upi",
            amount: Number(partUpi),
            transactionReference: transactionRef || "UPI Split",
          });
        }
        if (Number(partDue) > 0) {
          splits.push({
            method: "due",
            amount: Number(partDue),
            transactionReference: transactionRef || "Due Ledger",
          });
        }

        // If user didn't use the multi-tender split inputs, but used the single amount input:
        if (splits.length === 0) {
          const payNum = Number(amount);
          if (!Number.isFinite(payNum) || payNum <= 0) {
            throw new Error("Please enter a valid partial amount to pay.");
          }
          if (payNum > remainingBalance) {
            throw new Error(
              `Partial payment amount (₹${payNum}) cannot exceed balance of ₹${remainingBalance.toFixed(2)}.`
            );
          }
          payload.method = partSubMethod || "cash";
          payload.amount = payNum;
          payload.transactionReference = transactionRef.trim() || "Part Payment";
        } else {
          // Validate total splits
          if (totalSplitTendered > remainingBalance) {
            throw new Error(
              `Total split payments (₹${totalSplitTendered}) cannot exceed balance of ₹${remainingBalance.toFixed(2)}.`
            );
          }
          payload.splits = splits;
        }
      } else {
        // Single payment method (cash, upi, card, due, other)
        const payNum = Number(amount);

        if (!Number.isFinite(payNum) || payNum <= 0) {
          throw new Error("Please enter a valid payment amount greater than ₹0.");
        }

        if (payNum > remainingBalance) {
          throw new Error(
            `Payment amount (₹${payNum}) cannot exceed outstanding balance of ₹${remainingBalance.toFixed(2)}.`
          );
        }

        if ((method === "upi" || method === "card") && !transactionRef.trim()) {
          throw new Error(
            `Please provide a transaction reference or auth code for ${method.toUpperCase()} payments.`
          );
        }

        payload.method = method;
        payload.amount = payNum;
        payload.transactionReference = transactionRef.trim();
      }

      const response = await paymentApi.createPayment(payload);

      if (response.success) {
        setSuccessMessage("Payment recorded successfully!");
        setTransactionRef("");
        setPartCash("");
        setPartCard("");
        setPartUpi("");
        setPartDue("");
        await loadOrderAndPayments();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Payment processing failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred while processing payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-6">
          {/* Header */}
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#D62828]" />
                <h3 className="text-lg font-black text-[#222222]">
                  Settle Order — {currentOrder?.orderNo}
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Multi-tender billing settlement, split tender, and partial payment support
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Feedback Banners */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center space-x-2 text-xs text-[#166534]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Balances Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">
                  Net Amount
                </p>
                <p className="text-lg font-black text-[#222222] mt-1">
                  {formatCurrency(netAmount)}
                </p>
              </div>

              <div className="p-3.5 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
                <p className="text-[10px] font-bold uppercase text-[#166534] tracking-wider">
                  Amount Paid
                </p>
                <p className="text-lg font-black text-[#16A34A] mt-1">
                  {formatCurrency(roundedPaid)}
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  remainingBalance > 0
                    ? "bg-[#FEF2F2] border-[#FECACA]"
                    : "bg-[#F0FDF4] border-[#BBF7D0]"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    remainingBalance > 0 ? "text-[#991B1B]" : "text-[#166534]"
                  }`}
                >
                  Balance Due
                </p>
                <p
                  className={`text-lg font-black mt-1 ${
                    remainingBalance > 0 ? "text-[#D62828]" : "text-[#16A34A]"
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
            </div>

            {/* Order Details Mini Banner */}
            <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#222222]">
                    Order Type:{" "}
                    <span className="capitalize">{currentOrder?.orderType}</span>
                  </span>
                  {currentOrder?.tableId && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFC928]/30 text-[#92400E]">
                      Table {currentOrder.tableId.tableNumber || currentOrder.tableId}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge type="order" status={currentOrder?.orderStatus} />
                  <StatusBadge type="payment" status={currentOrder?.paymentStatus} />
                </div>
              </div>

              {/* Items List */}
              <div className="py-1 divide-y divide-gray-100 max-h-28 overflow-y-auto">
                {currentOrder?.items?.map((it, idx) => (
                  <div key={idx} className="py-1 flex justify-between text-[#6B7280]">
                    <span>
                      {it.name} × {it.quantity}
                    </span>
                    <span className="font-medium text-[#222222]">
                      {formatCurrency(it.itemTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between text-[#6B7280]">
                <span>Subtotal: {formatCurrency(currentOrder?.subtotal)}</span>
                {currentOrder?.discount > 0 && (
                  <span>Discount: -{formatCurrency(currentOrder?.discount)}</span>
                )}
                <span>Tax: +{formatCurrency(currentOrder?.taxAmount)}</span>
              </div>
            </div>

            {/* Payment Method & Settle Form (Enabled only if balance > 0) */}
            {!isFullyPaid ? (
              <form onSubmit={handleRecordPayment} className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider">
                      Select Payment Option:
                    </label>
                    <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      All Payment Modes Allowed
                    </span>
                  </div>

                  {/* Payment Method Selector Grid - Including Part Payment! */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod("cash")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "cash"
                          ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                          : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span className="text-xs font-bold">Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("card")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "card"
                          ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                          : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-bold">Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("upi")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "upi"
                          ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                          : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-xs font-bold">UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("part")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "part"
                          ? "bg-[#FEF3C7] border-[#D97706] text-[#B45309] ring-2 ring-[#D97706] shadow-sm font-black"
                          : "bg-amber-50/50 border-amber-200 text-[#B45309] hover:bg-amber-50"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-[#D97706]" />
                      <span className="text-xs font-bold">Part / Split</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("due")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "due"
                          ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                          : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">Due</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("other")}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        method === "other"
                          ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                          : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold">Other</span>
                    </button>
                  </div>
                </div>

                {/* Conditional UI for PART / SPLIT Payment Mode */}
                {method === "part" ? (
                  <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-[#D97706]" />
                        <h4 className="text-xs font-black uppercase text-[#92400E]">
                          Part Payment / Multi-Tender Split
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-[#92400E]">
                        Balance: {formatCurrency(remainingBalance)}
                      </span>
                    </div>

                    {/* Quick Percentage Chips */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#92400E] mb-1.5 flex items-center">
                        <Percent className="w-3 h-3 mr-1" /> Quick Partial Tender Chips:
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "25%", val: (remainingBalance * 0.25).toFixed(2) },
                          { label: "50%", val: (remainingBalance * 0.5).toFixed(2) },
                          { label: "75%", val: (remainingBalance * 0.75).toFixed(2) },
                          { label: "Full Balance", val: remainingBalance.toFixed(2) },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setAmount(chip.val);
                              setPartCash(chip.val);
                              setPartCard("");
                              setPartUpi("");
                              setPartDue("");
                            }}
                            className="py-1 px-2 bg-white hover:bg-amber-100 text-[#92400E] text-xs font-bold rounded-lg border border-[#FDE68A] transition-colors cursor-pointer text-center"
                          >
                            {chip.label} (₹{chip.val})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Tender Allocation Inputs */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#FDE68A] space-y-2.5">
                      <p className="text-xs font-bold text-[#222222]">
                        Allocate Across Payment Methods:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Cash Split */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-semibold text-gray-700 flex items-center space-x-1">
                              <Banknote className="w-3.5 h-3.5 text-gray-500" />
                              <span>Cash Amount (₹)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => autoFillSplit("cash")}
                              className="text-[10px] text-amber-700 hover:underline font-bold"
                            >
                              Auto Fill
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingBalance}
                            value={partCash}
                            onChange={(e) => setPartCash(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                          />
                        </div>

                        {/* Card Split */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-semibold text-gray-700 flex items-center space-x-1">
                              <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                              <span>Card Amount (₹)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => autoFillSplit("card")}
                              className="text-[10px] text-amber-700 hover:underline font-bold"
                            >
                              Auto Fill
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingBalance}
                            value={partCard}
                            onChange={(e) => setPartCard(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                          />
                        </div>

                        {/* UPI Split */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-semibold text-gray-700 flex items-center space-x-1">
                              <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                              <span>UPI / QR Amount (₹)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => autoFillSplit("upi")}
                              className="text-[10px] text-amber-700 hover:underline font-bold"
                            >
                              Auto Fill
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingBalance}
                            value={partUpi}
                            onChange={(e) => setPartUpi(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                          />
                        </div>

                        {/* Due Split */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-semibold text-gray-700 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>Due / Credit Amount (₹)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => autoFillSplit("due")}
                              className="text-[10px] text-amber-700 hover:underline font-bold"
                            >
                              Auto Fill
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingBalance}
                            value={partDue}
                            onChange={(e) => setPartDue(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                          />
                        </div>
                      </div>

                      {/* Split Summary Bar */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">
                          Total Allocated:{" "}
                          <strong className="text-[#222222]">
                            {formatCurrency(totalSplitTendered)}
                          </strong>
                        </span>
                        <span
                          className={`font-bold ${
                            splitRemainingToAllocate > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          Remaining to Allocate: {formatCurrency(splitRemainingToAllocate)}
                        </span>
                      </div>
                    </div>

                    {/* Optional Note / Reference */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#92400E] mb-1">
                        Split / Part Payment Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. Split billing, partial token paid, remainder due"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#FDE68A] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Single Tender Form (Cash, Card, UPI, Due, Other) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount to Pay */}
                    <div>
                      <label className="block text-xs font-semibold text-[#222222] mb-1">
                        Payment Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remainingBalance}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm font-bold bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC928]"
                      />
                      <p className="text-[10px] text-[#6B7280] mt-1">
                        Full or partial payment allowed. Enter amount needed.
                      </p>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                      <label className="block text-xs font-semibold text-[#222222] mb-1">
                        {method === "due"
                          ? "Customer Name / Contact Note *"
                          : method === "other"
                          ? "Aggregator / Payment Note *"
                          : `Transaction Ref / Auth Code ${
                              method !== "cash" ? "*" : "(Optional)"
                            }`}
                      </label>
                      <input
                        type="text"
                        required={method !== "cash"}
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder={
                          method === "upi"
                            ? "e.g. UPI Ref / UTR No"
                            : method === "card"
                            ? "e.g. Card Auth / Last 4"
                            : method === "due"
                            ? "e.g. Due to John Doe (9876543210)"
                            : method === "other"
                            ? "e.g. Zomato / Swiggy / Cheque No"
                            : "Optional Cash Note"
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC928]"
                      />
                    </div>
                  </div>
                )}

                {/* Settle Action Button */}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (method === "part"
                      ? totalSplitTendered <= 0 && (!amount || Number(amount) <= 0)
                      : Number(amount) <= 0)
                  }
                  className="w-full py-3 bg-[#D62828] hover:bg-[#b91c1c] text-white font-black text-sm rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Settlement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {method === "part"
                          ? `Record Part / Split Payment of ${
                              totalSplitTendered > 0
                                ? formatCurrency(totalSplitTendered)
                                : amount
                                ? formatCurrency(amount)
                                : "₹0.00"
                            }`
                          : `Record Payment of ${
                              amount ? formatCurrency(amount) : "₹0.00"
                            }`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
                <p className="font-black text-sm text-[#166534]">
                  This order is completely settled and fully paid!
                </p>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Preview & Print Receipt</span>
                </button>
              </div>
            )}

            {/* Previous Payments History */}
            {payments.length > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  <History className="w-3.5 h-3.5" />
                  <span>Recorded Payment History ({payments.length})</span>
                </div>

                <div className="space-y-1.5">
                  {payments.map((p) => (
                    <div
                      key={p._id}
                      className="p-2.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold uppercase text-[#222222]">
                            {p.method}
                          </span>
                          {p.transactionReference && (
                            <span className="text-[11px] text-[#6B7280]">
                              Ref: {p.transactionReference}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">
                          {formatDateTime(p.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-[#16A34A]">
                          +{formatCurrency(p.amount)}
                        </span>
                        <p className="text-[10px] font-semibold text-gray-400 capitalize">
                          {p.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-gray-100 text-[#222222] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Receipt Preview</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#222222] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          order={currentOrder}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
};

export default SettleModal;
