import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { receiptApi } from "../../api/receiptApi";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { Printer, RefreshCw, AlertCircle, X, Check } from "lucide-react";

export const ReceiptModal = ({ order, receiptId, onClose }) => {
  const { settings } = useSelector((state) => state.settings);

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState(settings?.receiptPaperSize || "80mm");

  const receiptRef = useRef(null);

  useEffect(() => {
    const fetchOrGenerateReceipt = async () => {
      setLoading(true);
      setError("");

      try {
        if (receiptId) {
          const res = await receiptApi.getReceiptById(receiptId);
          if (res.data) setReceipt(res.data);
        } else if (order?._id) {
          // 1. Try to fetch existing receipt for this order
          try {
            const existingRes = await receiptApi.getReceiptByOrderId(order._id);
            if (existingRes.data) {
              setReceipt(existingRes.data);
              setLoading(false);
              return;
            }
          } catch {
            // Receipt does not exist yet, create a new one
          }

          // 2. Create receipt
          const createRes = await receiptApi.createReceipt(order._id);
          if (createRes.data) {
            setReceipt(createRes.data);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchOrGenerateReceipt();
  }, [order?._id, receiptId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-6">
        {/* Controls Toolbar (hidden during print) */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA] no-print">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#D62828]" />
            <span className="font-extrabold text-sm text-[#222222]">
              Receipt Preview & Print
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Paper size selector */}
            <div className="flex items-center space-x-1 bg-white border border-[#E5E7EB] rounded-lg p-0.5 text-xs font-semibold">
              {["58mm", "80mm", "A4"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPaperSize(sz)}
                  className={`px-2 py-1 rounded transition-colors ${
                    paperSize === sz
                      ? "bg-[#D62828] text-white"
                      : "text-[#6B7280] hover:text-[#222222]"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              disabled={loading || !receipt}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto bg-[#FFFDF8] flex justify-center">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#6B7280]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
              Generating receipt snapshot...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
              <span>{error}</span>
            </div>
          ) : receipt ? (
            /* Thermal Receipt Preview Paper Container */
            <div
              ref={receiptRef}
              className={`bg-white text-black p-4 border border-dashed border-gray-300 shadow-sm font-mono text-xs ${
                paperSize === "58mm"
                  ? "w-[240px] receipt-58mm"
                  : paperSize === "80mm"
                  ? "w-[320px] receipt-80mm"
                  : "w-[500px] receipt-A4"
              }`}
            >
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-black pb-2 mb-2">
                <h2 className="text-base font-black tracking-tight uppercase">
                  {settings?.shopName || "BongPizza Restaurant"}
                </h2>
                {settings?.address && (
                  <p className="text-[10px] leading-tight text-gray-700">
                    {settings.address}
                  </p>
                )}
                {settings?.phone && (
                  <p className="text-[10px] text-gray-700">
                    Phone: {settings.phone}
                  </p>
                )}
                {settings?.gstNumber && settings?.showGstNumberOnReceipt && (
                  <p className="text-[10px] font-bold">
                    GSTIN: {settings.gstNumber}
                  </p>
                )}
              </div>

              {/* Order Meta Info */}
              <div className="space-y-0.5 text-[11px] border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-bold">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order No:</span>
                  <span className="font-bold">{receipt.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{formatDateTime(receipt.issuedAt || receipt.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Type:</span>
                  <span className="font-bold uppercase">{receipt.orderType}</span>
                </div>
                {receipt.tableNumber && (
                  <div className="flex justify-between">
                    <span>Table No:</span>
                    <span className="font-bold">Table {receipt.tableNumber}</span>
                  </div>
                )}
                {receipt.customer?.name && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{receipt.customer.name}</span>
                  </div>
                )}
                {receipt.customer?.phone && (
                  <div className="flex justify-between">
                    <span>Contact:</span>
                    <span>{receipt.customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="flex justify-between text-[10px] font-bold uppercase pb-1 border-b border-black mb-1">
                  <span className="flex-1">Item</span>
                  <span className="w-8 text-center">Qty</span>
                  <span className="w-16 text-right">Amount</span>
                </div>

                <div className="space-y-1">
                  {receipt.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="flex-1 capitalize truncate pr-1">
                        {it.name}
                      </span>
                      <span className="w-8 text-center">{it.quantity}</span>
                      <span className="w-16 text-right font-medium">
                        {formatCurrency(it.itemTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-1 text-[11px] border-b border-black pb-2 mb-2">
                <div className="flex justify-between">
                  <span>Subtotal ({receipt.totalItems} items):</span>
                  <span>{formatCurrency(receipt.subtotal)}</span>
                </div>

                {receipt.discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(receipt.discount)}</span>
                  </div>
                )}

                {receipt.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST / Taxes:</span>
                    <span>+{formatCurrency(receipt.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black pt-1 border-t border-black">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(receipt.netAmount)}</span>
                </div>
              </div>

              {/* Payments Section */}
              <div className="space-y-0.5 text-[11px] border-b border-dashed border-gray-400 pb-2 mb-2">
                <div className="flex justify-between font-bold">
                  <span>Payment Status:</span>
                  <span className="uppercase text-black">
                    {receipt.paymentStatus === "paid" || order?.paymentStatus === "paid"
                      ? "PAID"
                      : receipt.paymentStatus}
                  </span>
                </div>

                {receipt.payments?.map((pm, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span className="uppercase">Tender ({pm.method}):</span>
                    <span>{formatCurrency(pm.amount)}</span>
                  </div>
                ))}

                {(!receipt.payments || receipt.payments.length === 0) &&
                  (receipt.paymentStatus === "paid" || order?.paymentStatus === "paid") && (
                    <div className="flex justify-between text-gray-700">
                      <span className="uppercase">Tender:</span>
                      <span>{formatCurrency(receipt.amountPaid || receipt.netAmount)}</span>
                    </div>
                  )}

                <div className="flex justify-between pt-0.5 font-bold">
                  <span>Amount Paid:</span>
                  <span>
                    {formatCurrency(
                      receipt.paymentStatus === "paid" || order?.paymentStatus === "paid"
                        ? receipt.amountPaid && receipt.amountPaid > 0
                          ? receipt.amountPaid
                          : receipt.netAmount
                        : receipt.amountPaid
                    )}
                  </span>
                </div>

                {receipt.balanceDue > 0 &&
                  receipt.paymentStatus !== "paid" &&
                  order?.paymentStatus !== "paid" && (
                    <div className="flex justify-between font-black text-red-600">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(receipt.balanceDue)}</span>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 space-y-1">
                <p className="text-[10px] font-semibold">
                  {settings?.receiptFooter || "Thank you for visiting BongPizza!"}
                </p>
                <p className="text-[9px] text-gray-500">
                  Powered by BongPizza Restaurant POS
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
