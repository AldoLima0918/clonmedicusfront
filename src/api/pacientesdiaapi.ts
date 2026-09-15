import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Asegúrate de que esta URL sea correcta

export const getPacientesDelDia = async (userId: string) => {
  try {
    const token = localStorage.getItem("token"); // Obtén el token JWT del almacenamiento local
    const response = await axios.get(`${API_URL}/pacientes-dia`, {
      headers: {
        Authorization: `Bearer ${token}`, // Incluye el token en el encabezado
      },
      params: {
        userId, // Envía el userId como parámetro de la solicitud
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching pacientes del día:", error);
    throw error;
  }
};
