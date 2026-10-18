import { apiClient, downloadBlob } from "./client";

export const reportApi = {
  getDailySalesReport: async ({ startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";

    return apiClient(`/report/getDailySalesReport${query}`, {
      method: "GET",
    });
  },

  getPaymentBreakdown: async ({ startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";

    return apiClient(`/report/getPaymentBreakDown${query}`, {
      method: "GET",
    });
  },

  // Export Sales Report (Excel or CSV)
  exportSalesReport: async ({ startDate, endDate, format = "xlsx" } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("format", format);
    const ext = format === "csv" ? "csv" : "xlsx";
    const defaultFilename = `BongPizza_Sales_Report_${startDate || "all"}_to_${endDate || "all"}.${ext}`;

    return downloadBlob(`/report/export/sales?${params.toString()}`, defaultFilename);
  },

  // Export Orders (Excel or CSV)
  exportOrders: async ({ startDate, endDate, format = "xlsx" } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("format", format);
    const ext = format === "csv" ? "csv" : "xlsx";
    const defaultFilename = `BongPizza_Orders_${startDate || "all"}_to_${endDate || "all"}.${ext}`;

    return downloadBlob(`/report/export/orders?${params.toString()}`, defaultFilename);
  },

  // Export Payments (Excel or CSV)
  exportPayments: async ({ startDate, endDate, format = "xlsx" } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("format", format);
    const ext = format === "csv" ? "csv" : "xlsx";
    const defaultFilename = `BongPizza_Payments_${startDate || "all"}_to_${endDate || "all"}.${ext}`;

    return downloadBlob(`/report/export/payments?${params.toString()}`, defaultFilename);
  },
};
