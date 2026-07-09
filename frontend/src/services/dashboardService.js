import api from "./api";

const API_BASE = "/api/dashboard";

export const getDashboardStats = async () => {
  try {
    const response = await api.get(`${API_BASE}/stats`);
    return response.data; // { success: true, message: "...", data: {...} }
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch dashboard metrics.");
  }
};
