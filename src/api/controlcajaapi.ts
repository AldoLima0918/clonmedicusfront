import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Ajusta la URL según tu configuración

export const getMovimientosCaja = async () => {
  const response = await axios.get(`${API_URL}/movimientos`);
  return response.data;
};

export const addMovimientoCaja = async (movimiento: any) => {
  const response = await axios.post(`${API_URL}/movimientos`, movimiento);
  return response.data;
};

export const searchMovimientos = async (query: string) => {
  const response = await axios.get(`${API_URL}/movimientos/search`, {
    params: { query },
  });
  return response.data;
};

// Nueva función para obtener el último saldo de la caja
export const getUltimoSaldoCaja = async () => {
  const response = await axios.get(`${API_URL}/movimientos/ultimo-saldo`);
  return response.data;
};
