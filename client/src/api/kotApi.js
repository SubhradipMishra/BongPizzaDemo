import { apiClient } from "./client";

export const kotApi = {
  createKOT: async (kotData) => {
    return apiClient("/kot/create", {
      method: "POST",
      body: JSON.stringify(kotData),
    });
  },

  getAllKOTs: async (status = "") => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient(`/kot/getAllKOTs${query}`, {
      method: "GET",
    });
  },

  getKOTById: async (id) => {
    return apiClient(`/kot/getKOTById/${id}`, {
      method: "GET",
    });
  },

  updateKOTStatus: async (id, status) => {
    return apiClient(`/kot/updateKOTStatus/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
