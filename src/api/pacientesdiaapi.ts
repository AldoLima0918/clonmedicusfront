import axios from "axios";
import { socketService } from "@/services/socketService";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// WEBSOCKET HELPER
// ============================================

const ensureSocketConnection = () => {
  if (!socketService.isConnectedToSocket()) {
    socketService.connect();
  }
};

// ============================================
// API
// ============================================

export const getPacientesDelDia = async (userId: string) => {
  ensureSocketConnection();

  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/pacientes-dia`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching pacientes del día:", error);
    throw error;
  }
};