import { apiClient } from "./client";

export const settingsApi = {
  getSettings: async () => {
    return apiClient("/settings", {
      method: "GET",
    });
  },

  updateSettings: async (settingsData) => {
    return apiClient("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  },
};
