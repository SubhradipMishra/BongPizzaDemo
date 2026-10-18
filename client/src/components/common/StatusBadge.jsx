import React from "react";

export const StatusBadge = ({ type = "order", status = "" }) => {
  const normStatus = (status || "").toLowerCase().trim();

  // Payment Status Styling
  if (type === "payment") {
    switch (normStatus) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            Paid
          </span>
        );
      case "partially_paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Partially Paid
          </span>
        );
      case "unpaid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            Unpaid
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status || "Unknown"}
          </span>
        );
    }
  }

  // KOT Status Styling
  if (type === "kot") {
    switch (normStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Pending
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]">
            Preparing
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
            Ready
          </span>
        );
      case "served":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            Served
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  }

  // Table Status Styling
  if (type === "table") {
    switch (normStatus) {
      case "available":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Occupied
          </span>
        );
      case "billed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
            Billed
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            Reserved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  }

  // Order Status Styling
  switch (normStatus) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
          Pending
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]">
          Confirmed
        </span>
      );
    case "preparing":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]">
          Preparing
        </span>
      );
    case "ready":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
          Ready
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default StatusBadge;
