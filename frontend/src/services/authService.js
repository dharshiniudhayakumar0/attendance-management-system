import api from "./api";

// Since Vite proxies /login, we can call it relative to origin
export const login = async (username, password) => {
  try {
    const response = await api.post("/login", { username, password });
    return response.data; // Response format: { success: true, message: "...", data: { access_token, user } }
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Invalid credentials");
    }
    throw new Error("Server communication error. Please try again.");
  }
};
