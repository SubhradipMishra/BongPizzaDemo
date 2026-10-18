import { apiClient } from "./client";

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
};
