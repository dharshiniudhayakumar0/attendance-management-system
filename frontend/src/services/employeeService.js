import api from "./api";

const API_BASE = "/api/employees";

export const getEmployees = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);

    const response = await api.get(`${API_BASE}?${params.toString()}`);
    return response.data; // { success: true, message: "...", data: [...] }
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch employees.");
  }
};

export const getEmployeeById = async (id) => {
  try {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch employee details.");
  }
};

export const getEmployeeAttendanceHistory = async (id) => {
  try {
    const response = await api.get(`${API_BASE}/${id}/attendance-history`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch employee attendance history.");
  }
};

export const getDepartments = async () => {
  try {
    const response = await api.get(`${API_BASE}/departments`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch departments.");
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const response = await api.post(API_BASE, employeeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create employee.");
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`${API_BASE}/${id}`, employeeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update employee.");
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await api.delete(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete employee.");
  }
};
