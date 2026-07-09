import api from "./api";

const API_BASE = "/api/attendance";

export const getAttendance = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.employee_id) params.append("employee_id", filters.employee_id);
    if (filters.date) params.append("date", filters.date);
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);

    const response = await api.get(`${API_BASE}?${params.toString()}`);
    return response.data; // { success: true, message: "...", data: [...] }
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch attendance logs.");
  }
};

export const getAttendanceById = async (id) => {
  try {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch attendance record.");
  }
};

export const markAttendance = async (attendanceData) => {
  try {
    const response = await api.post(API_BASE, attendanceData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to mark attendance.");
  }
};

export const updateAttendance = async (id, attendanceData) => {
  try {
    const response = await api.put(`${API_BASE}/${id}`, attendanceData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update attendance.");
  }
};

export const deleteAttendance = async (id) => {
  try {
    const response = await api.delete(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete attendance record.");
  }
};

export const getAttendanceReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.month) params.append("month", filters.month);
    if (filters.year) params.append("year", filters.year);

    const response = await api.get(`${API_BASE}/report?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to generate attendance report.");
  }
};

export const getAttendanceEmployeeSummary = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);

    const response = await api.get(`${API_BASE}/employee-summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch attendance summary.");
  }
};
