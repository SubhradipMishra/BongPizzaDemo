import { apiClient, downloadBlob } from "./client";

export const backupApi = {
  // Trigger a full database backup archive
  triggerBackup: async () => {
    return apiClient("/backup/create", {
      method: "POST",
    });
  },

  // Retrieve backup logs history
  getHistory: async ({ limit = 30 } = {}) => {
    return apiClient(`/backup/history?limit=${limit}`, {
      method: "GET",
    });
  },

  // Download authorized backup archive file
  downloadBackup: async (backupId, filename = "bongpizza_backup.json.gz") => {
    return downloadBlob(`/backup/download/${backupId}`, filename);
  },

  // Verify and test integrity of a backup archive
  verifyBackup: async (backupId) => {
    return apiClient(`/backup/verify/${backupId}`, {
      method: "POST",
    });
  },
};
