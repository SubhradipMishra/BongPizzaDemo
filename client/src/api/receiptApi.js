import { apiClient } from "./client";

export const receiptApi = {
  createReceipt: async (orderId) => {
    return apiClient("/reciept/createReciept", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
  },

  getAllReceipts: async () => {
    return apiClient("/reciept/getAllReceipts", {
      method: "GET",
    });
  },

  getReceiptById: async (id) => {
    return apiClient(`/reciept/getReceiptById/${id}`, {
      method: "GET",
    });
  },

  getReceiptByOrderId: async (orderId) => {
    return apiClient(`/reciept/getReceiptByOrderId/${orderId}`, {
      method: "GET",
    });
  },
};
