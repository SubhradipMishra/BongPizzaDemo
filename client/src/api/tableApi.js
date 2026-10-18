import { apiClient } from "./client";

export const tableApi = {
  getTableGroups: async () => {
    return apiClient("/tablegroup/getall", {
      method: "GET",
    });
  },

  createTableGroup: async (groupData) => {
    return apiClient("/tablegroup/create", {
      method: "POST",
      body: JSON.stringify(groupData),
    });
  },

  updateTableGroup: async (id, groupData) => {
    return apiClient(`/tablegroup/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(groupData),
    });
  },

  deleteTableGroup: async (id) => {
    return apiClient(`/tablegroup/delete/${id}`, {
      method: "DELETE",
    });
  },

  getAllTables: async () => {
    return apiClient("/table/getall", {
      method: "GET",
    });
  },

  getAvailableTables: async () => {
    return apiClient("/table/available", {
      method: "GET",
    });
  },

  createTable: async (tableData) => {
    return apiClient("/table/create", {
      method: "POST",
      body: JSON.stringify(tableData),
    });
  },

  deleteTable: async (id) => {
    return apiClient(`/table/delete/${id}`, {
      method: "DELETE",
    });
  },

  updateTableStatus: async (id, status) => {
    return apiClient(`/table/status/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
